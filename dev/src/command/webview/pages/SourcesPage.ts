/*******************************************************************************
 * Copyright (c) 2019, 2020 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v2.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v20.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

// import * as vscode from "vscode";

import { ThemedImages, ThemelessImages } from "../../../constants/CWImages";
// import MCUtil from "../../MCUtil";
import WebviewUtil, { CommonWVMessages } from "../WebviewUtil";
import { ManageSourcesWVMessages } from "../SourcesPageWrapper";
import { WebviewResourceProvider } from "../WebviewWrapper";
import { TemplateSource } from "../../../codewind/Types";

export default function getManageSourcesPage(
    rp: WebviewResourceProvider, connectionLabel: string, isRemoteConnection: boolean, sources: TemplateSource[]): string {

    return `
    <!DOCTYPE html>

    <html>
    ${WebviewUtil.getHead(rp, "sources-registries-tables.css")}
    <body>

    <div id="top-section">
        ${WebviewUtil.buildTitleSection(rp, "Template Source Manager", connectionLabel, isRemoteConnection)}
        <div tabindex="0" id="learn-more-btn" class="btn" onclick="sendMsg('${CommonWVMessages.HELP}')">
            Learn More<img alt="Learn More" src="${rp.getImage(ThemedImages.Help)}"/>
        </div>
    </div>

    <div id="toolbar">
        <!--div class="btn" onclick="onEnableAllOrNone(event, true)">
            Enable All<img alt="Enable All" src="${rp.getImage(ThemedImages.Play)}"/>
        </div-->
        <div id="toolbar-right-buttons">
            <div tabindex="0" class="btn btn-background" onclick="sendMsg('${CommonWVMessages.REFRESH}')">
                Refresh<img alt="Refresh" src="${rp.getImage(ThemedImages.Refresh)}"/>
            </div>
            <div tabindex="0" id="add-btn" class="btn btn-prominent" onclick="sendMsg('${CommonWVMessages.ADD_NEW}')">
                Add New Source<img alt="Add New Source" src="${rp.getImage(ThemedImages.New, "dark")}"/>
            </div>
        </div>
    </div>

    <!-- If there are no sources enabled, show a warning that you can't create projects -->
    <!--div id="info-banner-container"-->
        <div class="warning-banner" ${sources.some((source) => source.enabled) ? `style="display: none;"` : ""}>
            <img src="${rp.getImage(ThemelessImages.Warning)}" alt="Warning"/>
            No template sources are enabled. You must enable at least one template source before creating projects.
        </div>
    <!--/div-->

    ${buildTemplateTable(rp, sources)}

    <script>
        const vscode = acquireVsCodeApi();

        ${WebviewUtil.getCopyScript()}

        function onToggle(toggleBtn) {
            // update the enable attr, and switch the toggle image
            const newEnablement = toggleBtn.getAttribute("${WebviewUtil.ATTR_ENABLED}") != "true";
            toggleBtn.setAttribute("${WebviewUtil.ATTR_ENABLED}", newEnablement);

            let newToggleImg, newToggleAlt;
            if (newEnablement) {
                newToggleImg = "${WebviewUtil.getStatusToggleIconSrc(rp, true, true)}";
                newToggleAlt = "${getStatusToggleAlt(true)}";
            }
            else {
                newToggleImg = "${WebviewUtil.getStatusToggleIconSrc(rp, false, true)}";
                newToggleAlt = "${getStatusToggleAlt(false)}";
            }
            toggleBtn.src = newToggleImg;
            toggleBtn.alt = newToggleAlt;

            sendMsg("${ManageSourcesWVMessages.ENABLE_DISABLE}", { repos: [ getRepoEnablementObj(toggleBtn) ] });
        }

        /**
         * Generate data field to pass back in IRepoEnablementEvent (see ManageTemplateReposCmd)
         */
        function getRepoEnablementObj(toggleBtn) {
            const repoID = toggleBtn.getAttribute("${WebviewUtil.ATTR_ID}");
            const enable = toggleBtn.getAttribute("${WebviewUtil.ATTR_ENABLED}") == "true";
            return {
                repoID,
                enable,
            };
        }

        function deleteSource(repoDeleteBtn) {
            const repoID = repoDeleteBtn.getAttribute("${WebviewUtil.ATTR_ID}");
            sendMsg("${CommonWVMessages.DELETE}", repoID);
        }

        function sendMsg(type, data = undefined) {
            const msg = { type: type, data: data };
            // console.log("Send message " + JSON.stringify(msg));
            vscode.postMessage(msg);
        }
    </script>

    </body>
    </html>
    `;
}

function buildTemplateTable(rp: WebviewResourceProvider, sources: TemplateSource[]): string {

    const repoRows = sources.map((source) => buildRow(rp, source));

    return `
    <table>
        <colgroup>
            <col class="btn-col"/>      <!-- Secured icon column -->
            <col id="name-col"/>
            <col id="style-col"/>
            <col id="descr-col"/>
            <col id="enabled-col"/>
            <!--col class="btn-col"/-->      <!-- Edit buttons column -->
            <col class="btn-col"/>      <!-- Delete buttons column -->
        </colgroup>
        <thead>
            <tr>
                <td></td>
                <td>Name</td>
                <td>Style</td>
                <td>Description</td>
                <td id="enabled-thead">Enabled</td>
                <!--td></td-->
                <td></td>
            </tr>
        </thead>
        <tbody>
            ${repoRows.join("")}
        </tbody>
    </table>
    `;
}

function buildRow(rp: WebviewResourceProvider, source: TemplateSource): string {
    const name = source.name || "No name available";
    const descr = source.description || "No description available";
    const toggleTitle = source.enabled ? "Disable source" : "Enable source";

    return `
    <tr>
        ${getSecuredTD(rp, source.authentication)}
        <td class="name-cell">
            <a title="${source.url} (Right click to copy)"
                onclick="sendMsg('${CommonWVMessages.OPEN_WEBLINK}', '${source.url}')"
                oncontextmenu="copy(event, '${source.url}', 'source URL')"
            >
                ${name}
            </a>
        </td>
        <td class="style-cell">${source.projectStyles.join(", ")}</td>
        <td class="descr-cell">${descr}</td>
        <td class="btn-cell">${WebviewUtil.getToggleInput(rp, source.enabled, toggleTitle, source.url)}</td>
        ${getDeleteBtnTD(rp, source)}
    </tr>
    `;
}

function getStatusToggleAlt(enabled: boolean): string {
    return enabled ? `Disable source` : `Enable source`;
}

function getSecuredTD(rp: WebviewResourceProvider, auth: { username?: string } | undefined): string {
    let securedImg: string;
    if (auth == null) {
        securedImg = "";
    }
    else {
        let title: string;
        if (auth.username) {
            title = `Authenticated as ${auth.username}`
        }
        else {
            title = `Authenticated with Access Token`;
        }
        securedImg = `<img alt="Private Source" title="${title}" src="${rp.getImage(ThemedImages.Locked)}"/>`;
    }

    return `
    <td class="btn-cell">
        ${securedImg}
    </td>
    `;
}

/*
function getEditBtnTD(rp: WebviewResourceProvider, source: TemplateSource): string {
    let editBtn: string;
    if (source.protected) {
        editBtn = "";
    }
    else {
        editBtn = `<input type="image" ${WebviewUtil.ATTR_ID}="${source.url}" alt="Edit" title="Edit"
            onclick="editSource(this)" class="btn" src="${rp.getImage(ThemedImages.Edit)}"/>`;
    }

    return `
    <td class="btn-cell">
        ${editBtn}
    </td>`;
}*/

function getDeleteBtnTD(rp: WebviewResourceProvider, source: TemplateSource): string {
    let deleteBtn: string;
    if (source.protected) {
        deleteBtn = "";
    }
    else {
        deleteBtn = `<input type="image" ${WebviewUtil.ATTR_ID}="${source.url}" alt="Delete" title="Delete"
            onclick="deleteSource(this)" class="btn" src="${rp.getImage(ThemedImages.Trash)}"/>`;
    }

    return `
    <td class="btn-cell">
        ${deleteBtn}
    </td>`;
}

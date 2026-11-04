window.pythonPipelineAPI = {
    interactWithPythonPipeline: window.pythonPipelineAPI.interactWithPythonPipeline
};

let EXTENSION_RESOURCE_HOLDER = {}
window.EXTENSION_RELATED_SNIPPETS = {}
let EXTENSION_STATUSES = {}
window.EXTENSION_SNIPPET_STARTUP_MUTATION_CALLBACKS = []
window.EXTENSION_SNIPPET_UNLOAD_MUTATION_CALLBACKS = []
window.favorites = [];
window.snapshotState = {};
window.EXTENSIONS_INJECTED = false
window.EXTENSION_RESOURCE_HOLDER = EXTENSION_RESOURCE_HOLDER
let LOADED_LAYOUT = false;
let LOADED_SCRIPTS = {}
window.isFullyLoaded = (script) => {
    LOADED_SCRIPTS[script] = true;
}

function extendSnapshotStates(object_list, script_id) {
    if (!script_id) console.error("NO SCRIPT ID WAS PROVIDED FOR SNAPSHOT EXTENSION")
    window.snapshotState[script_id] = object_list
}
window.extendSnapshotStates  = extendSnapshotStates

function preserveJSState() {
    let state = {}
    Object.keys(window.snapshotState).forEach((key) => {
        let values = window.snapshotState[key]()
        state[key] = values
    })

    return state
}

let unload = async (e) => {

    e.preventDefault();

    start_extra_load()

    let items = []
    Array.from(document.getElementById("viewport-resize-container").children).forEach((item) => {
        if (item.getAttribute("itemext")) {
            items.push(item)
            EXTENSION_SNIPPET_UNLOAD_MUTATION_CALLBACKS.forEach(fn => fn(item))
        }
    })

    let were_switched = {
        "editing": window.IS_EDITING,
        "docking": window.IS_SNAPPING
    }

    if (window.IS_SNAPPING) {
        window.switch_docking()
        were_switched["docking"] = true
    }
    if (window.IS_EDITING) {
        window.switch_editing()
        were_switched["editing"] = true
    }

    let total_innerHtml = ""
    items.forEach((item) => {
        total_innerHtml+="\n"+item.outerHTML
    })

    let JS_STATE = preserveJSState()
    console.log(JS_STATE)

    if (were_switched["editing"]) {
        window.switch_editing()
    }
    if (were_switched["docking"]) {
        window.switch_docking()
    }

    console.log(await window.pythonPipelineAPI.interactWithPythonPipeline(
        {
            "object": "preserve_layout",
            "args": [total_innerHtml, JS_STATE],
            "kwargs": {}
        }
    ))

    let argstates = [
        ["IS_SUPPORTING_VIEWPORT_RESIZE", JS_STATE["MAINPACKAGE-DESIGN_RELATED"]["IS_SUPPORTING_VIEWPORT_RESIZE"]],
        ["IS_DOCKING", window.IS_SNAPPING || were_switched["docking"]],
        ["IS_EDITING", window.IS_EDITING || were_switched["editing"]],
    ]

    argstates.forEach(async (argstate) => {
        await window.pythonPipelineAPI.interactWithPythonPipeline({
            "object": "update_ui_setting",
            "args": argstate,
            "kwargs": {}
        })
    })

    await window.pythonPipelineAPI.interactWithPythonPipeline({
        "object": "update_setting",
        "args": ["EXTENSIONS", EXTENSION_STATUSES],
        "kwargs": {}
    })

    await window.pythonPipelineAPI.interactWithPythonPipeline({
        "object": "save_settings",
        "args": [],
        "kwargs": {}
    });

    await sleep(2000)
}

window.addEventListener("beforeunload", unload)

let _pendingExtensionScriptLoads = []

async function injectExtensions() {
    let init_path = ".\\extensions"
    let extensions = await window.pythonPipelineAPI.interactWithPythonPipeline(
        {
            "object": "get_files",
            "args": [init_path],
            "kwargs": {}
        }
    )
    for (let extension of Object.keys(extensions)) {
        if (extensions[extension]["isDir"] !== true) {
            continue
        }
        EXTENSION_STATUSES[extension] = false
        let extensionContents = await window.pythonPipelineAPI.interactWithPythonPipeline(
            {
                "object": "get_files",
                "args": [init_path + "\\" + extension],
                "kwargs": {}
            }
        )
        for (let file of Object.keys(extensionContents)) {
            let item = extensionContents[file];
            if (item["isDir"] !== false) {
                return
            }
            if (file.endsWith(".css") === true) {
                let stylesheet = document.createElement("link")
                stylesheet.rel = "stylesheet"
                stylesheet.href = init_path + "\\" + extension + "\\" + file
                if (!(Object.keys(EXTENSION_RESOURCE_HOLDER).includes(extension))) {
                    EXTENSION_RESOURCE_HOLDER[extension] = {
                        "assets": [],
                        "snippets": {}
                    }
                }
                EXTENSION_RESOURCE_HOLDER[extension]["assets"].push(stylesheet)
            } else if (file.endsWith(".js") === true) {
                let script = document.createElement("script");
                script.src = init_path + "\\" + extension + "\\" + file
                if (!(Object.keys(EXTENSION_RESOURCE_HOLDER).includes(extension))) {
                    EXTENSION_RESOURCE_HOLDER[extension] = {
                        "assets": [],
                        "snippets": {}
                    }
                }
                EXTENSION_RESOURCE_HOLDER[extension]["assets"].push(script)
            } else if (file.endsWith(".html") === true) {
                let snippet = item["contents"]
                if (!(Object.keys(EXTENSION_RESOURCE_HOLDER).includes(extension))) {
                    EXTENSION_RESOURCE_HOLDER[extension] = {
                        "assets": [],
                        "snippets": {}
                    }
                }
                EXTENSION_RESOURCE_HOLDER[extension]["snippets"][file.split(".")[0]] = snippet
            }
        }
    }
}

function disableExtension(name) {
    console.log("Disabled extension " + name)
    EXTENSION_STATUSES[name] = false
    EXTENSION_RESOURCE_HOLDER[name].assets.forEach(asset => {
        if (document.head.contains(asset)) {
            document.head.removeChild(asset)
        } else if (document.body.contains(asset)) {
            document.body.removeChild(asset)
        } else {
            console.error(`Unable to find ${name} for removal`)
        }
    })
}

function enableExtension(name) {
    console.log("Enabled extension " + name)
    EXTENSION_STATUSES[name] = true
    EXTENSION_RESOURCE_HOLDER[name].assets.forEach(asset => {
        if (asset.nodeName === 'LINK') {
            document.head.appendChild(asset)
        } else if (asset.nodeName === 'SCRIPT') {
            if (asset.src && !asset.dataset.loaded) {
                let loadPromise = new Promise(resolve => {
                    let settle = () => {
                        asset.dataset.loaded = "true"
                        resolve()
                    }
                    asset.addEventListener('load', settle, { once: true })
                    asset.addEventListener('error', () => {
                        console.warn("[extension] script failed to load:", asset.src)
                        settle()
                    }, { once: true })
                })
                _pendingExtensionScriptLoads.push(loadPromise)
            }
            document.body.appendChild(asset)
        }
    })
}

async function whenExtensionsReady() {
    let pending = _pendingExtensionScriptLoads.slice()
    _pendingExtensionScriptLoads.length = 0
    if (pending.length === 0) return
    await Promise.all(pending)
    while (true) {
        let result = true;
        Object.values(LOADED_SCRIPTS).forEach((script) => {
            result = result && script
        })
        if (result === true) break;
        await window.sleep(100)
    }
}

function notify(message, time = 2500) {
    const applicationContainer = document.getElementById("notification-container");
    let totalHeight = 0;

    const previous = Array.from(applicationContainer.children).map((el) => ({
        el,
        top: el.getBoundingClientRect().top,
        transform: getComputedStyle(el).transform,
    }));

    const newContainer = document.createElement("div");
    newContainer.classList.add("DarkDiv", "PosHorizontally", "NoSelect");
    newContainer.style.width = "fit-content";
    newContainer.style.height = "fit-content";
    newContainer.style.padding = "5px";
    newContainer.style.marginTop = "3px";
    newContainer.style.marginBottom = "3px";
    newContainer.style.borderRadius = "7.5px";
    newContainer.style.boxShadow = "0 10px 10px rgba(0, 0, 0, 0.3)";
    newContainer.style.willChange = "transform";
    newContainer.style.transition = "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)";
    newContainer.style.transform =
        "translateY(calc(-100% - 20px - " +
        applicationContainer.getBoundingClientRect().height +
        "px))";

    let newContent
    if (typeof message === "string") {
        let newSpan = document.createElement("span");
        newSpan.style.fontSize = "18px";
        newSpan.classList.add("SenFont", "NoSelect");
        newSpan.style.color = "white";
        newSpan.textContent = message;

        function close_callback() {
            if (applicationContainer.contains(newContainer) === true) {
                applicationContainer.removeChild(newContainer);
            }
            newContainer.remove();
            totalHeight = 0;
            for (const child of applicationContainer.children) {
                const cs = getComputedStyle(child);
                totalHeight +=
                    child.getBoundingClientRect().height +
                    (parseFloat(cs.marginTop) || 0) +
                    (parseFloat(cs.marginBottom) || 0);
            }
            applicationContainer.style.height = totalHeight + "px";
        }

        let newButton = document.createElement("img");
        newButton.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAv0lEQVR4nO2VXQrCMBAGxwtalZY86NkVLP6hN6hQCaQgJdXdsFHEDOQt+02TbBooFP6JBrgBB2ChqFsCJ+AK1FrpLBT2YXSAE9S5MHeo8xlqLk8BEvlY6sc5RbyKBE3JY9IuZCRRRwLvwGbUC7E561SpRJ5N+m4rpUdhvvJsK5XKs0qZONNYw31E2ueUu280V/Piykjuubl0wFxeGfwyfYaa1uCR2KeIjwbPos9QU4Uv3iq3zM/dhdp5irhQ+E0ekyummbane5EAAAAASUVORK5CYII="
        newButton.style.width = "20px"
        newButton.style.height = "20px"
        newButton.style.filter = "invert(1)"
        newButton.style.cursor = "pointer"
        newButton.draggable = false
        newButton.classList.add("NoSelect");
        newButton.onclick = close_callback

        newContent = document.createElement("div");
        newContent.style.width = "fit-content";
        newContent.style.height = "fit-content";
        newContent.style.gap = "5px";
        newContent.style.display = "flex"
        newContent.style.alignItems = "center"
        newContent.classList.add("PosHorizontally", "NoSelect");

        newContent.appendChild(newButton)
        newContent.appendChild(newSpan)
    } else {
        newContent = message
    }

    newContainer.appendChild(newContent);

    applicationContainer.prepend(newContainer);
    if (applicationContainer.childNodes.length > 6) {
        for (let i = applicationContainer.childNodes.length - 1; i > 5; i--) {
            applicationContainer.removeChild(applicationContainer.childNodes[i])
        }
    }

    for (const {el, top, transform} of previous) {
        const delta = top - el.getBoundingClientRect().top;
        if (!delta) continue;

        el.style.transition = "none";
        el.style.transform =
            transform === "none"
                ? `translateY(${delta}px)`
                : `translateY(${delta}px) ${transform}`;

        el.getBoundingClientRect();

        el.style.transition = "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)";
        el.style.transform = "";
    }

    for (const child of applicationContainer.children) {
        const cs = getComputedStyle(child);
        totalHeight +=
            child.getBoundingClientRect().height +
            (parseFloat(cs.marginTop) || 0) +
            (parseFloat(cs.marginBottom) || 0);
    }
    applicationContainer.style.height = totalHeight + "px";

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            newContainer.style.transform = "translateY(0px)";
        });
    });

    async function callback() {
        await new Promise(resolve => setTimeout(resolve, time));
        newContainer.style.animation = "fade 1.25s linear";
        await new Promise(resolve => setTimeout(resolve, 1200));
        newContainer.style.opacity = "0";
        if (applicationContainer.contains(newContainer) === true) {
            applicationContainer.removeChild(newContainer);
        }
        newContainer.remove();
        totalHeight = 0;
        for (const child of applicationContainer.children) {
            const cs = getComputedStyle(child);
            totalHeight +=
                child.getBoundingClientRect().height +
                (parseFloat(cs.marginTop) || 0) +
                (parseFloat(cs.marginBottom) || 0);
        }
        applicationContainer.style.height = totalHeight + "px";
    }

    if (time !== -1) {
        callback()
    }
}

async function main() {
    await injectExtensions()
    const choiceContainer = document.getElementById("extension-choosing")
    let snippetContainer = document.getElementById("viewport-resize-container")
    for (const extension of Object.keys(EXTENSION_RESOURCE_HOLDER)) {

        let newOuterBox = document.createElement("div")
        newOuterBox.style.width = "calc(100% - 20px)"
        newOuterBox.style.height = "fit-content"
        newOuterBox.style.marginLeft = "10px"
        newOuterBox.classList.add("PosVertically", "NoSelect")
        newOuterBox.style.marginBottom = "5px"

        let newBox = document.createElement("div")
        newBox.id = "extension-choosing-" + extension
        newBox.style.display = "flex"
        newBox.style.alignItems = "center"
        newBox.style.gap = "5px"
        newBox.style.width = "100%"

        let newText = document.createElement("span")
        newText.textContent = extension
        newText.style.fontSize = "14px"
        newText.style.color = "white"
        newText.classList.add("GoogleCodeFont", "NoSelect")
        newText.style.padding = "0"
        newText.style.margin = "0"

        let callback = () => {
            if (document.getElementById("extension-choosing-checkbox-" + extension).checked === true) {
                enableExtension(extension)
                if (Object.keys(EXTENSION_RESOURCE_HOLDER[extension]["snippets"]).length > 0) {
                    let divider = document.getElementById("extension-divider-" + extension)
                    divider.style.flexGrow = "1"
                    document.getElementById("extension-snippets-" + extension).style.display = "block"
                }
            } else {
                disableExtension(extension)
                if (Object.keys(EXTENSION_RESOURCE_HOLDER[extension]["snippets"]).length > 0) {
                    let divider = document.getElementById("extension-divider-" + extension)
                    divider.style.flexGrow = "0"
                    divider.style.width = "0"
                    document.getElementById("extension-snippets-" + extension).style.display = "none"
                }
            }

            window.EXTENSION_RELATED_SNIPPETS[extension].forEach((critem) => {
                critem.classList.toggle("NOTSAFE")
                if (!document.body.contains(critem)) window.EXTENSION_RELATED_SNIPPETS[extension].splice(
                    window.EXTENSION_RELATED_SNIPPETS[extension].indexOf(critem), 1
                )
            })
        }

        let newCheckbox = document.createElement("input")
        newCheckbox.id = "extension-choosing-checkbox-" + extension
        newCheckbox.type = "checkbox"
        newCheckbox.classList.add("CustomCheckbox", "NoSelect")
        newCheckbox.onclick = callback

        newBox.appendChild(newCheckbox)
        newBox.appendChild(newText)

        let idfiedContainer

        if (Object.keys(EXTENSION_RESOURCE_HOLDER[extension]["snippets"]).length > 0) {
            let divider = document.createElement("div")
            divider.id = "extension-divider-" + extension
            divider.style.flexShrink = "0"
            divider.style.height = "3px"
            divider.style.backgroundImage = "linear-gradient(to left, #ff4400, #ff9900)"
            divider.style.transition = "all 0.25s"
            newBox.appendChild(divider)

            idfiedContainer = document.createElement("div")
            idfiedContainer.style.width = "fit-content"
            idfiedContainer.style.height = "fit-content"
            idfiedContainer.id = "extension-snippets-" + extension
            idfiedContainer.style.display = "none"
        }

        newOuterBox.appendChild(newBox)

        if (Object.keys(EXTENSION_RESOURCE_HOLDER[extension]["snippets"]).length > 0) {
            newOuterBox.appendChild(idfiedContainer)
        }

        window.EXTENSION_RELATED_SNIPPETS[extension] = []

        for (let snippet of Object.keys(EXTENSION_RESOURCE_HOLDER[extension]["snippets"])) {
            let snippetCallback = () => {
                console.log(window.IS_SNAPPING, window.IS_EDITING)

                let needEditSwitch = false;
                if (window.IS_EDITING === true) {
                    window.switch_editing()
                    needEditSwitch = true;
                }

                let needSnapSwitch = false;
                if (window.IS_SNAPPING === true) {
                    window.switch_docking()
                    needSnapSwitch = true;
                }

                let newItem = document.createElement("div")
                newItem.innerHTML = EXTENSION_RESOURCE_HOLDER[extension]["snippets"][snippet]
                snippetContainer.appendChild(newItem.childNodes[0])
                if (snippetContainer.lastElementChild.classList.contains("DraggableDiv")) {
                    window.updateDraggable(snippetContainer.lastElementChild)
                }
                if (snippetContainer.lastElementChild.classList.contains("ResizeableDiv")) {
                    window.updateResizeable(snippetContainer.lastElementChild)
                }

                window.EXTENSION_RELATED_SNIPPETS[extension].push(snippetContainer.lastElementChild)

                let snapshot = idDupeObs.takeRecords()
                for (const mutation of snapshot) {
                    if (mutation.addedNodes.length > 0) {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1) {
                                let res = checkDupedId(node)
                                if (res) {
                                    notify("Cannot create this Element! Id already matches!")
                                    node.remove()
                                }
                            }
                        })
                    }
                }

                window.EXTENSION_SNIPPET_STARTUP_MUTATION_CALLBACKS.forEach(
                    (fn) => fn(snapshot)
                )

                if (needEditSwitch) {
                    window.switch_editing()
                }
                if (needSnapSwitch) {
                    window.switch_docking()
                }

                if (window.IS_EDITING) {
                    snippetContainer.lastElementChild.classList.add("editing");
                    snippetContainer.lastElementChild.classList.remove("not-editing");
                    snippetContainer.lastElementChild.classList.add("FaintDivBorder");
                    snippetContainer.lastElementChild.classList.remove("RemNormalBorderPadding");
                } else {
                    snippetContainer.lastElementChild.classList.add("not-editing");
                    snippetContainer.lastElementChild.classList.remove("editing");
                    snippetContainer.lastElementChild.classList.remove("FaintDivBorder");
                    snippetContainer.lastElementChild.classList.add("RemNormalBorderPadding");
                }

                if (window.IS_SNAPPING) {
                    snippetContainer.lastElementChild.classList.add("Docking");
                    snippetContainer.lastElementChild.classList.remove("not-Docking");
                    snippetContainer.lastElementChild.classList.add("Dockable");
                    snippetContainer.lastElementChild.classList.remove("not-Dockable");
                } else {
                    snippetContainer.lastElementChild.classList.add("not-Docking");
                    snippetContainer.lastElementChild.classList.remove("Docking");
                    snippetContainer.lastElementChild.classList.add("not-Dockable");
                    snippetContainer.lastElementChild.classList.remove("Dockable");
                }
            }

            let newSnippetContainer = document.createElement("div")
            newSnippetContainer.style.width = "fit-content"
            newSnippetContainer.style.height = "fit-content"
            newSnippetContainer.classList.add("PosHorizontally", "NoSelect")
            newSnippetContainer.style.cursor = "pointer"
            newSnippetContainer.style.marginLeft = "19px"
            newSnippetContainer.onclick = snippetCallback

            let newSnippetText = document.createElement("span")
            newSnippetText.textContent = snippet
            newSnippetText.style.fontSize = "14px"
            newSnippetText.style.color = "white"
            newSnippetText.classList.add("GoogleCodeFont", "NoSelect")
            newSnippetText.style.padding = "0"
            newSnippetText.style.margin = "0"
            newSnippetText.style.marginBottom = "3px"

            let newIcon = document.createElement("span")
            newIcon.style.color = "#ff9900"
            newIcon.style.fontSize = "14px"
            newIcon.classList.add("SenFont", "NoSelect")
            newIcon.textContent = "+"
            newIcon.style.marginRight = "5px"

            newSnippetContainer.appendChild(newIcon)
            newSnippetContainer.appendChild(newSnippetText)
            idfiedContainer.appendChild(newSnippetContainer)
        }

        choiceContainer.appendChild(newOuterBox)

    }

    window.EXTENSIONS_INJECTED = true
}

function genericSetter(what, value) {
    eval(what+" = "+JSON.stringify(value))
}

async function initializeStateManager(script_id, generic_setter=genericSetter) {
    LOADED_SCRIPTS[script_id] = false;
    if (window.startupState && LOADED_LAYOUT) {
        if (Object.keys(window.startupState).length > 0 && window.startupState[script_id]) {
            Object.keys(window.startupState[script_id]).forEach(key => {
                try {
                    generic_setter(key, window.startupState[script_id][key])
                    console.log("SETUP FOR " + key + " COMPLETED IN " + script_id)
                } catch (err) {
                    console.warn("NO ITEM WAS PROVIDED FOR VARIABLE " + key + " OF " + script_id + " STATE MANAGER")
                    throw err;
                }
            })
        }
    } else if (!LOADED_LAYOUT) {
        let sigma = {}.hasOwnProperty()
        let res = await window.pythonPipelineAPI.interactWithPythonPipeline(
            {
                "object": "load_lastest_layout",
                "args": [],
                "kwargs": {}
            }
        )
        let settings = await window.pythonPipelineAPI.interactWithPythonPipeline({
            "object": "pass_current_settings",
            "args": [],
            "kwargs": {}
        })

        let extension_map = {}
        let all_ext_containers;
        if (window.EXTENSIONS_INJECTED === false) {
            await main()
        }
        all_ext_containers = document.querySelectorAll('[id^="extension-choosing-"]')
        let all_chosen_containers = []
        all_ext_containers.forEach(ext => {
            if (ext.id.split("-").length !== 4) return
            all_chosen_containers.push(ext)
        })
        console.log(all_chosen_containers)
        all_chosen_containers.forEach(inp => {
            console.log(Object.keys(settings["EXTENSIONS"]), inp.id.split("-")[3])
            if (Object.keys(settings["EXTENSIONS"]).includes(inp.id.split("-")[3]) === false) {return;}
            if (settings["EXTENSIONS"][inp.id.split("-")[3]] !== true) {return;}
            inp.click(); console.log("CLICKED", inp)
        })

        window.startupState = res["JS_STATES"]
        LOADED_LAYOUT = true;

        let main_container = document.getElementById("viewport-resize-container")

        await whenExtensionsReady()

        let creationHelper = (chunk) => {
            console.log(window.IS_SNAPPING, window.IS_EDITING)
            let needEditSwitch = false;
            if (window.IS_EDITING === true) {
                window.switch_editing()
                needEditSwitch = true;
            }

            let needSnapSwitch = false;
            if (window.IS_SNAPPING === true) {
                window.switch_docking()
                needSnapSwitch = true;
            }

            main_container.appendChild(chunk)
            if (chunk.classList.contains("DraggableDiv")) {
                window.updateDraggable(chunk)
            }
            if (chunk.classList.contains("ResizeableDiv")) {
                window.updateResizeable(chunk)
            }

            try {
                window.EXTENSION_RELATED_SNIPPETS[chunk.getAttribute("itemext").split("-")[0]].push(chunk)
            } catch {
                console.log("AN ERROR OCURED WHEN RUNNING THROUGH ITEMEXT NAME, LOWERING ALL LETTERS FOR BETTER CHECK")
                let temp_related_snippets = {}
                Object.keys(window.EXTENSION_RELATED_SNIPPETS).forEach(key => {
                    temp_related_snippets[key.toLowerCase()] = key
                })
                console.log("NEW MAPPING CREATED:", temp_related_snippets)
                window.EXTENSION_RELATED_SNIPPETS[temp_related_snippets[chunk.getAttribute("itemext").split("-")[0]]].push(chunk)
            }

            let res = checkDupedId(chunk)
            let is_removed = false;
            if (res === true) {
                is_removed = true
                notify("Cannot create this Element! Id already matches!")
                chunk.remove()
            }

            console.log(window.EXTENSION_SNIPPET_STARTUP_MUTATION_CALLBACKS)
            if (is_removed === false) {
                console.log("RUNNING CUSTOM CALLBACKS",window.EXTENSION_SNIPPET_STARTUP_MUTATION_CALLBACKS.length)
                window.EXTENSION_SNIPPET_STARTUP_MUTATION_CALLBACKS.forEach(
                    fn => {fn([{ addedNodes: [chunk] }])}
                )
            }

            if (needEditSwitch === true) {
                window.switch_editing()
            }
            if (needSnapSwitch === true) {
                window.switch_docking()
            }

            if (window.IS_EDITING) {
                chunk.classList.add("editing");
                chunk.classList.remove("not-editing");
                chunk.classList.add("FaintDivBorder");
                chunk.classList.remove("RemNormalBorderPadding");
            } else {
                chunk.classList.add("not-editing");
                chunk.classList.remove("editing");
                chunk.classList.remove("FaintDivBorder");
                chunk.classList.add("RemNormalBorderPadding");
            }

            if (window.IS_SNAPPING) {
                chunk.classList.add("Docking");
                chunk.classList.remove("not-Docking");
                chunk.classList.add("Dockable");
                chunk.classList.remove("not-Dockable");
            } else {
                chunk.classList.add("not-Docking");
                chunk.classList.remove("Docking");
                chunk.classList.add("not-Dockable");
                chunk.classList.remove("Dockable");
            }
        }

        let temp_container = document.createElement("div")
        temp_container.innerHTML = res["HTML_PART"]
        Array.from(temp_container.children).forEach(child => creationHelper(child))

        // if (window.startupState["MAINPACKAGE-DESIGN_RELATED"]["IS_SUPPORTING_VIEWPORT_RESIZE"] === true) {
        //     window.resolveLayout()
        // }

        await end_extra_load()
        initializeStateManager(script_id, generic_setter)
    }
}
window.initializeStateManager = initializeStateManager

window.notify = notify

function checkDupedId(item) {
    let check = (layer) => {
        if ([...layer.childNodes].length === 0) {
            const matched = document.querySelectorAll(`[id="${CSS.escape(layer.id)}"]`)
            return matched.length > 1;
        }
        return [...layer.childNodes].some((el) => {
            const matched = document.querySelectorAll(`[id="${CSS.escape(el.id)}"]`)
            return matched.length > 1 || check(el);
        })
    }
    return check(item)
}

window.checkDupedId = checkDupedId

const idDupeObs = new MutationObserver(() => {})
idDupeObs.observe(document.body, { childList: true, subtree: true })
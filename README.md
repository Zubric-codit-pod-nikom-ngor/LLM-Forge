# LLM Forge

---

> **LLM Forge** is my small little side project that is basically an
exercise for me to try and learn JS along with HTML

---

### But seriously, what is this about?

This app will be an ultimate *utility* for working with ***LLMs***
mainly through *HuggingFace*.
Well, the app concept is to make a ***very*** and i mean
***VERY*** customizable environment. The app itself is basically
an engine for working with external snippets (which I call
```extensions```) which all provide some tool for working with
LLMs.

---

### Some important stuff for your own extensions

#### Snippets:
1) snippets are all contained within HTML files
2) inside the snippet file there is only one fundamental object that works as a frame of some sort, apply all properties to this outer object!
3) the outer object should always, and I mean ***ALWAYS*** have an ***itemext*** attribute that describes what sort of snippet it is (syntax is basically extension name and the document name divided by a minus sign)
4) context menu instructions are ***WIP*** and are set through ``GENERIC_CONTEXT_INSTRUCTIONS`` and ``GENERIC_CONTEXT_PROPERTY_CHANGE``
and other custom classes added by your scripts + other cool stuff will be set through the scripts provided

#### Scripts:
1) all functions and stuff are stored / completed in them
2) they are always in .js files (intuitively)
3) just make them not break any other stuff :)
4) context menu stuff are added through this:
    ```js
    // on window.CUSTOM_CONTEXT_OPS you add all the custom operations.
    // you can add all your custom operations as shown in the example:
    window.CUSTOM_CONTEXT_OPS["PLACEHOLDER"] = [ // here you place the name of the css class that will trigger the list to show.
        "PLACEHOLDER_1", // header name which will be displayed on top of this section.
        ["PLACEHOLDER_2", () => {}] // a name to the option and what it does when clicked.
        // you can have as many of the options as possible, so don't go easy.
        // and also, the targeted object for the context menu is passed to the
        // function automatically.
    ]
   
    // on window.CUSTOM_CONTEXT_PROPS you can modify the classes
    // of the targeted object:
    window.CUSTOM_CONTEXT_PROPS.push(
        "PLACEHOLDER_3" // the name of the class, that will be toggled
    )
    ```
5) some code that should (nearly) ***ALWAYS*** be present in them:
   - you should have this after all variables you want to save & load:
    ```js
    window.extendSnapshotStates(() => {
        return {
            // here you paste the string of the variable's name as a key
            // and the variable itself as a value.
        }
    }, "PLACEHOLDER") // here you add your custom script id instead of PLACEHOLDER.
    window.initializeStateManager("PLACEHOLDER") // your custom script id repeated.
    ```
   - you should ***ALWAYS*** add this at the end of your script (or at which point the script should be loaded):
    ```js
    window.isFullyLoaded("PLACEHOLDER") // still the same custom script id from before.
    ```
6) optional setup callbacks for your snippets are set through this:
    ```js
    window.EXTENSION_SNIPPET_STARTUP_MUTATION_CALLBACKS.push(
        (m) => {} // this runs when ANY snippet is added, (including the load sequence) the input is always a result of a normal MutationObserver.
    )
   
    window.EXTENSION_SNIPPET_UNLOAD_MUTATION_CALLBACKS.push(
        (item) => {} // this ALWAYS runs when saving the layout, the argument will take every single added snippet one by one, prep everything here before unloading.
    )
    ```
   
#### Stylesheets *(**.css** files)*:
There are no restrictions, as long as they do not break anything :)

#### General:

- ***ALL*** file and directory names within your extension reflect what will be displayed / injected into the app (so please do not do anything stupid)
- it is advised to make every snippet the same style (or at least close to it) as every other one
- no malicious content and do not abuse any systems :)


---

### Future plans:
1) Make a way to set your HF token + give credit to its services
2) Make a way to set up the model of your choice
3) Make a chat window
4) Add an ability to chain up multiple LLMs to make them all work on the same task (cooperating and validating each other's arguments on the work)
5) Add an updater and some sort of browsing system ???

---

That will be it for now, I'm still mastering the work of web developers and
still learning how the big world of programming works.

Everyone is free to use this simple app and maybe contribute, I will accept the contributions with pride :)

### Bye!
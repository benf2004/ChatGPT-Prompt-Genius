function main() {
    let p = document.querySelector("main > div > div > div > div")
    let c;
// loop through c to see if they are p elements or pre elements
    let page = []
    let first_time = true
    let id;
    document.body.appendChild(document.createElement(`div`)).setAttribute("id", "chat_history");
    let history_box = document.querySelector("#chat_history");

    function saveChildInnerHTML(parent, clone = true) { // generated by ChatGPT
        // Get the child elements of the parent
        let p1;
        if (clone) {
            p1 = parent.cloneNode(true)
            p1.setAttribute("style", "display: none;");
            history_box.innerHTML = "";
            history_box.appendChild(p1);
        } else {
            p1 = parent
        }
        var children = p1.children;

        // Create a string to store the innerHTML of each child
        var childInnerHTML = '';

        // Loop through each child element
        for (var i = 0; i < children.length; i++) {
            // Clone the child element
            var child = children[i];
            if (child.tagName == "PRE") {
                let div = child.firstChild.children[1]
                div.firstChild.classList.add('p-4')
                let text = div.innerHTML
                let clipboard = `<i class="fa-regular clipboard fa-clipboard"></i>`
                let copy_bar = `<div class="p-2 copy float-right">${clipboard} &nbsp; Copy code</div>`
                let template = `<pre>${copy_bar}<div>${text}</div></pre><br>`
                console.log(template)
                childInnerHTML += template;
            } else {
                // Remove the child's class attribute
                child.removeAttribute("class");

                // Recursively call the function on the child's children
                saveChildInnerHTML(child, false);

                // Add the child's innerHTML to the string
                childInnerHTML += child.outerHTML;
            }
        }

        return childInnerHTML;
    }

    function save_thread(human, h) {
        let text;
        if (human) {
            text = h.innerText // saves as plain text
            text = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }
        if (!human) {
            text = saveChildInnerHTML(h.firstChild.children[1].firstChild.firstChild) // saves as html
        }
        return text
    }

    function getDate() { // generated by ChatGPT
        var date = new Date();
        var options = {year: 'numeric', month: 'long', day: 'numeric'};
        return date.toLocaleString('default', options);
    }

    function getTime() { // generated by ChatGPT
        var currentDate = new Date();
        var options = {
            hour12: true,
            hour: "numeric",
            minute: "numeric"
        };
        var timeString = currentDate.toLocaleTimeString("default", options);
        return timeString
    }

    function generateUUID() {
        // create an array of possible characters for the UUID
        var possibleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        // create an empty string that will be used to generate the UUID
        var uuid = "";

        // loop over the possible characters and append a random character to the UUID string
        for (var i = 0; i < 36; i++) {
            uuid += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
        }

        // return the generated UUID
        return uuid;
    }


    function save_page() {
        console.log(`saving page`)
        c = p.children
        if (c.length > 2) {
            let t;
            browser.storage.local.get({threads: null}).then((result) => {
                t = result.threads
                page = []
                for (let i = 0; i < c.length - 1; i++) {
                    let human = i % 2 === 0;
                    let text = save_thread(human, c[i])
                    console.log(text)
                    if (text.endsWith(`<p>network error</p>`) || text.endsWith(`<p>Load failed</p>`)) {
                        console.log(`error`)
                        text = t[t.length - 1].convo[i]
                        if (!text.endsWith(`(error)`)) {
                            text = `${text}<br> (error)`
                        }
                    }
                    page.push(text)
                }
                if (t !== null) {
                    if (first_time) {
                        id = generateUUID()
                        let thread = {date: getDate(), time: getTime(), convo: page, favorite: false, id: id}
                        t.push(thread)
                        first_time = false
                    } else {
                        let thread = {date: getDate(), time: getTime(), convo: page, favorite: false, id: id}
                        t[t.length - 1] = thread
                    }
                    browser.storage.local.set({threads: t})
                } else {
                    let thread = {date: getDate(), time: getTime(), convo: page, favorite: false, id: generateUUID()}
                    let t = [thread]
                    first_time = false
                    browser.storage.local.set({threads: t})
                }
            });
        }
    }

    document.addEventListener('keydown', function (event) { // generated by ChatGPT
        // Check if the pressed key was the Enter key
        if (event.key === 'Enter') {
            setTimeout(save_page, 500)
        }
    });

    let main = p
    var interval;
    main.addEventListener('DOMSubtreeModified', function () { // generated by ChatGPT
        if (!timer_started) {
            setInterval(save_page, 2000);
        }
        timer_started = true;
    });
    let reset = document.querySelector("nav").firstChild
    reset.addEventListener('click', function () {
        first_time = true
    })
    let timer_started = false
}

setTimeout(main, 1000)
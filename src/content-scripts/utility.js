/*
	Misc utilities that are repeated across different files in content-scripts.
	To access in page context, inject the entire file into the page.
 */
function getObjectIndexByID(id, list) { // created by ChatGPT
    // Iterate over the list of objects
    for (let i = 0; i < list.length; i++) {
        const obj = list[i];

        // Check if the object has an `id` property that matches the given id
        if (obj.id && obj.id === id) {
            // If a match is found, return the object
            return i;
        }
    }

    // If no match is found, return null
    return null;
}

function getDate() { // generated by ChatGPT
    var date = new Date();
    var options = {year: 'numeric', month: 'long', day: 'numeric'};
    return date.toLocaleString('default', options);
}

function isPaidSubscriptionActive() {
    let result = window.__NEXT_DATA__?.props?.pageProps?.accountStatusResponse?.account_plan?.is_paid_subscription_active;
    if (result == undefined) {
        result = (JSON.parse(window.__NEXT_DATA__?.textContent || "{}")).props?.pageProps?.accountStatusResponse?.account_plan?.is_paid_subscription_active;
    }
    if (result == undefined){ // see history resync - this should be accurate but sometimes could be slow
        result = (document.getElementById("plusNetwork")?.value === "true")
    }
    if (result == undefined){ // see prompt-inject - gets the user setting from storage.
        result = (document.getElementById("plusManual")?.value === "true")
    }
    return result;
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

function convertChatToMarkdown(chat, title)
{
    let string = "";
    if(title)
    {
        string += "# " + title + "\n";
    }
    else
    {
        string += "# " + "ChatGPT Conversation" + "\n";
    }
    string += "\n"; // two newlines because MD is like that
    let convo = chat;
    for(let i = 0; i < convo.length; i++)
    {
        let speaker = i % 2 === 0 ? "Human" : "Assistant";
        string += "**" + speaker + ":**\n";
        string += convo[i] + "\n";
        string += "\n";
        string += "***\n";
        string += "\n";
    }

    // timestamp
    let date = getDate();
    let time = getTime();

    string += "Exported on " + date + " " + time + ".";

    let blob = encodeStringAsBlob(string);
    return blob;
}

function encodeStringAsBlob(string)
{
    let bytes = new TextEncoder().encode(string);
    let blob = new Blob([bytes], {
        type: "application/json;charset=utf-8"
    });
    return blob;
}
/* conversion functions for export and download */
function convertThreadToJSONFile(thread)
{
    let data = thread;
    let string = JSON.stringify(data);
    let blob = encodeStringAsBlob(string);
    return blob;
}

function convertThreadToTextFile(thread)
{
    let string = "Date:" + thread.date + " " + thread.time + "\n";
    let convo = thread.convo;
    for(let i = 0; i < convo.length; i++)
    {
        let speaker = i % 2 === 0 ? "Human" : "Assistant";
        string += speaker + ": " + convo[i] + "\n";
    }
    let blob = encodeStringAsBlob(string);
    return blob;
}

// basially using the fileSaver.js, it's an IIFE to save on implementing the <a> singleton.
const downloadBlobAsFile = (function()
{
    let a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function (blob, file_name)
    {
        let url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = file_name;
        a.click();
        window.URL.revokeObjectURL(url);
    }
})();

function getCSSFromSheet(sheet) {
    return Array.from(sheet.cssRules)
        .map((rule) => rule.cssText)
        .join("");
}


function htmlToMDSyntax(html) { // accounts for an edge case where chatgpt produces both an ordered list and an unordered list when exporting
    let newh =  html
        .replaceAll(`<code>`, '\`')
        .replaceAll(`</code>`, '\`')
        .replaceAll(`<p>`, '\n')
        .replaceAll(`</p>`, '\n')
        .replaceAll(`<h1>`, '# ')
        .replaceAll(`</h1>`, '')
        .replaceAll(`<h2>`, '## ')
        .replaceAll(`</h2>`, '')
        .replaceAll(`<h3>`, '### ')
        .replaceAll(`</h3>`, '');

    let isOrderedList = html.includes('<ol>');
    let isUnorderedList = html.includes('<ul>');

    if (isOrderedList){
        newh = newh
            .replaceAll(`<ol>`, `<ol class="ordered-list">`)
            .replaceAll(`</ol>`, `</ol>`);

        let parser = new DOMParser();
        let doc = parser.parseFromString(newh, 'text/html');
        let orderedListItems = doc.querySelectorAll('.ordered-list li');
        for (let i = 0; i < orderedListItems.length; i++) {
            orderedListItems[i].innerHTML = `${i + 1}. ` + orderedListItems[i].innerHTML;
        }
        newh = doc.body.innerHTML
            .replaceAll(`<ol class="ordered-list">`, "\n")
            .replaceAll(`</ol>`, "\n")
            .replaceAll(`</li>`, "\n")
    }
    if (isUnorderedList){
        newh = newh
            .replaceAll(`<ul>`, `<ul class="unordered-list">`)
            .replaceAll(`</ul>`, `</ul>`);

        let parser = new DOMParser();
        let doc = parser.parseFromString(newh, 'text/html');
        let unorderedListItems = doc.querySelectorAll('.unordered-list li');
        for (let i = 0; i < unorderedListItems.length; i++) {
            unorderedListItems[i].innerHTML = `- ` + unorderedListItems[i].innerHTML;
        }
        newh = doc.body.innerHTML
            .replaceAll(`<ul class="unordered-list">`, "\n")
            .replaceAll(`</ul>`, "\n")
            .replaceAll(`</li>`, "\n")
    }
    newh = newh.replaceAll(`<li>`, "")

    return newh
}

function injectScript(file, node) {
    var th = document.getElementsByTagName(node)[0];
    var s = document.createElement('script');
    s.setAttribute('type', 'text/javascript');
    s.setAttribute('src', file);
    th.appendChild(s);
}

/*
	mirror the state in a non-binary tree
	we use a class for convenience and namespace;
	to export to JSON, use the dedicated .toJSON() function
 */
function TreeNode(data)
{
	this.leaves = [];
	this.data = data;
	// instance
	this.currentLeafIndex = -1;
}

TreeNode.prototype.getData = function()
{
	return this.data;
}

TreeNode.prototype.getCurrentLeaf = function()
{
	return this.leaves[this.currentLeafIndex];
}

TreeNode.prototype.getLeaves = function()
{
	return this.leaves;
}

TreeNode.prototype.addLeaf = function(leaf)
{
	this.leaves.push(leaf);
	this.currentLeafIndex++;
}

TreeNode.prototype.addLeafCurrentLeaf = function(leaf)
{
	let currentLeaf = this.leaves[this.currentLeafIndex];
	if(currentLeaf)
	{
		currentLeaf.addLeaf(leaf);
	}
}

TreeNode.prototype.addLeafByData = function(data)
{
	let leaf = new TreeNode(data);
	this.addLeaf(leaf);
}

TreeNode.prototype.setData = function(data)
{
	this.data = data;
}

TreeNode.prototype.setCurrentLeafIndex = function(index)
{
	this.currentLeafIndex = index;
}

// traverses the tree according to the current leaf indices
// returns the data in an array, much like the old .convo field
TreeNode.prototype.getCurrentData = function()
{
	let data = [this.data];
	let currentLeaf = this.leaves[this.currentLeafIndex];
	let leafData = [];
	if(currentLeaf)
	{
		leafData = currentLeaf.getCurrentData();
	}
	return data.concat(leafData);
}

// return a primitive data version for storage
TreeNode.prototype.toJSON = function()
{
	let JSONObject = {data:this.data, leaves:[]};
	for(let index = 0, length = this.leaves.length; index < length; index++)
	{
		if(this.leaves[index])
		{
			JSONObject.leaves[index] = this.leaves[index].toJSON();
		}
		else
		{
			console.warn(`TreeNode.toJSON: Empty object at index ${index}.`);
		}
	}
	return JSONObject;
}
function main() {
    chrome.storage.local.get({prompts: []}, function (result) {
        let prompts = JSON.stringify(result.prompts)
        document.body.appendChild(document.createElement(`input`)).setAttribute("id", "prompts_storage")
        document.querySelector("#prompts_storage").setAttribute("type", "hidden")
        document.querySelector("#prompts_storage").value = prompts
    })
    injectScript(chrome.runtime.getURL('content-scripts/prompts.js'), 'body');
    setTimeout(getAd, 1000)
}

main()

async function getAd(){
    console.log("Sending message to background page");
    chrome.runtime.sendMessage({type: "ad"});
}

let adInterval;
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.type === "adresponse") {
            console.log(request.ad)
            let adDiv = document.getElementById("cgpt-pg-ad")
            console.log(adDiv)
            if (adDiv){
                adDiv.innerHTML = request.ad;
            }
            else{
                adInterval = setInterval(pollAd, 1000)
            }
            function pollAd(){
                if (adDiv){
                    adDiv.innerHTML = request.ad;
                    clearInterval(adInterval)
                }
            }
        }
    }
);

let promptURL = window.location.href;

function check_url() {
    if (promptURL !== window.location.href) {
        promptURL = window.location.href;
        setTimeout(getAd, 500)
        console.log("URL CHANGE")
    }
}
setInterval(check_url, 1000);

/*let url = chrome.runtime.getURL('pages/prompts.html')

setTimeout(() => {
    document.querySelector("#prompt-link").href = url
}, 2000)*/
import { Parser } from './libs/m3u8 - parser.js';

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'getVRUrl') {
        const pickcode = request.pickcode;
        const url = `https://115vod.com/site/api/video/m3u8/${pickcode}.m3u8`;

        fetch(url)
           .then(response => response.text())
           .then(data => {
                const parser = new Parser();
                parser.push(data);
                const manifest = parser.end();
                let playlists = manifest && manifest.playlists;
                if (Array.isArray(playlists) && playlists.length > 0) {
                    playlists.sort((a, b) => {
                        if (a.attributes.BANDWIDTH < b.attributes.BANDWIDTH) {
                            return -1;
                        } else if (a.attributes.BANDWIDTH > b.attributes.BANDWIDTH) {
                            return 1;
                        } else if (a.attributes.BANDWIDTH == b.attributes.BANDWIDTH) {
                            return 0;
                        }
                    });
                    const videoUrl = playlists[playlists.length - 1].uri.replace('http://', 'https://');
                    chrome.tabs.sendMessage(sender.tab.id, {
                        action: 'initVR',
                        videoUrl: videoUrl
                    });
                }
            })
           .catch(error => {
                console.error('Error fetching VR URL:', error);
            });

        return true;
    }
});
document.addEventListener('DOMContentLoaded', function() {
    const vrButton = document.createElement('button');
    vrButton.id = 'open-vr';
    vrButton.style.position = 'fixed';
    vrButton.style.top = '10px';
    vrButton.style.right = '10px';
    vrButton.style.height = '30px';
    vrButton.style.padding = '0 15px';
    vrButton.style.border = '1px solid #2777F8';
    vrButton.style.borderRadius = '4px';
    vrButton.style.lineHeight = '30px';
    vrButton.style.textAlign = 'center';
    vrButton.style.verticalAlign = 'middle';
    vrButton.style.outline = '0';
    vrButton.style.background = '#2777F8';
    vrButton.style.color = '#fff';
    vrButton.textContent = '开启VR模式';
    vrButton.dataset.vropen = '0';

    const videoTitle = document.querySelector('.video-title');
    if (videoTitle) {
        videoTitle.appendChild(vrButton);
    }

    vrButton.addEventListener('click', function() {
        getVRUrl();
        const isOpened = parseInt(this.dataset.vropen);
        if (isOpened) {
            location.reload();
        } else {
            this.dataset.vropen = '1';
            this.textContent = '退出VR模式';
        }
    });

    function getQueryString(name) {
        const reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
        const r = window.location.search.substr(1).match(reg);
        if (r != null) {
            return decodeURIComponent(r[2]);
        }
        return null;
    }

    function getVRUrl() {
        chrome.runtime.sendMessage({
            action: 'getVRUrl',
            pickcode: getQueryString('pickcode')
        });
    }
});
export class Browser {
    say(text) {
        // Func to say..
        return window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    }

    pause() {
        // Pause YT video
        return document.querySelector('video').pause();
    }

    play() {
        // Play the YT video
        return document.querySelector('video').play();
    }

    mute() {
        // Mute the YT video
        return document.getElementsByClassName('ytp-volume-icon')[0].click();
    }

    unmute() {
        // Unmute the YT video
        return document.getElementsByClassName('ytp-volume-icon')[0].click();
    }
}
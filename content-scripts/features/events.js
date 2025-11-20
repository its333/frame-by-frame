/*--------------------------------------------------------------
# EVENTS
# Enhanced video handling with delegation and lifecycle management.
--------------------------------------------------------------*/

(function () {
        'use strict';

        var BODY = document.body || document.documentElement;

        /*--------------------------------------------------------------
        # VIDEO MANAGER
        # Tracks video elements, attaches listeners once, and cleans up
        # when elements leave the DOM.
        --------------------------------------------------------------*/

        function VideoManager() {
                this.videos = new Map();
                this.activeVideo = null;
                this.observer = null;

                this.handleBodyInteraction = this.handleBodyInteraction.bind(this);
                this.handleMutations = this.handleMutations.bind(this);

                this.setupDelegatedListeners();
                this.observeDom();
                this.bootstrapExistingVideos();
        }

        VideoManager.prototype.setupDelegatedListeners = function () {
                /*
                 * Use event delegation so that newly created videos are picked up
                 * automatically without registering global listeners for each one.
                 */
                BODY.addEventListener('click', this.handleBodyInteraction, true);
                BODY.addEventListener('pointerdown', this.handleBodyInteraction, true);
        };

        VideoManager.prototype.observeDom = function () {
                var config = { childList: true, subtree: true };

                this.observer = new MutationObserver(this.handleMutations);
                this.observer.observe(document.documentElement || document, config);
        };

        VideoManager.prototype.bootstrapExistingVideos = function () {
                var existing = document.querySelectorAll('video');

                for (var i = 0; i < existing.length; i++) {
                        this.trackVideo(existing[i]);
                }
        };

        VideoManager.prototype.inspectNode = function (node, callback) {
                if (!node) {
                        return;
                }

                if (node.nodeName === 'VIDEO') {
                        callback(node);
                }

                if (node.querySelectorAll) {
                        var nested = node.querySelectorAll('video');

                        for (var i = 0; i < nested.length; i++) {
                                callback(nested[i]);
                        }
                }
        };

        VideoManager.prototype.handleMutations = function (mutations) {
                for (var i = 0; i < mutations.length; i++) {
                        var mutation = mutations[i];

                        for (var j = 0; j < mutation.addedNodes.length; j++) {
                                this.inspectNode(mutation.addedNodes[j], this.trackVideo.bind(this));
                        }

                        for (var k = 0; k < mutation.removedNodes.length; k++) {
                                this.inspectNode(mutation.removedNodes[k], this.untrackVideo.bind(this));
                        }
                }
        };

        VideoManager.prototype.handleBodyInteraction = function (event) {
                var target = event && event.target ? event.target : null;
                var video = target && target.closest ? target.closest('video') : null;

                if (!video) {
                        return;
                }

                this.trackVideo(video);
                this.setActiveVideo(video);
        };

        VideoManager.prototype.trackVideo = function (video) {
                if (!(video instanceof HTMLVideoElement)) {
                        return;
                }

                if (this.videos.has(video)) {
                        return;
                }

                var listeners = [];
                var register = function (type, handler) {
                        video.addEventListener(type, handler, true);
                        listeners.push(function () {
                                video.removeEventListener(type, handler, true);
                        });
                };

                var onTimeUpdate = function () {
                        try {
                                if (extension.ui && typeof extension.ui.update === 'function') {
                                        extension.ui.update();
                                }
                        } catch (error) {
                                console.error('Frame-by-Frame: failed to update UI on timeupdate', error);
                        }
                };

                register('loadedmetadata', this.setActiveVideo.bind(this, video));
                register('play', this.setActiveVideo.bind(this, video));
                register('playing', this.setActiveVideo.bind(this, video));
                register('timeupdate', onTimeUpdate);
                register('emptied', this.untrackVideo.bind(this, video));

                this.videos.set(video, { cleanup: listeners });

                if (!this.activeVideo) {
                        this.setActiveVideo(video);
                }
        };

        VideoManager.prototype.untrackVideo = function (video) {
                var record = this.videos.get(video);

                if (!record) {
                        return;
                }

                for (var i = 0; i < record.cleanup.length; i++) {
                        try {
                                record.cleanup[i]();
                        } catch (error) {
                                console.warn('Frame-by-Frame: failed to clean listener', error);
                        }
                }

                this.videos.delete(video);

                if (this.activeVideo === video) {
                        this.activeVideo = null;
                        extension.videos.active = null;

                        if (extension.ui && typeof extension.ui.hide === 'function') {
                                extension.ui.hide();
                        }
                }
        };

        VideoManager.prototype.ensureActiveVideo = function () {
                if (this.activeVideo && !this.activeVideo.isConnected) {
                        this.untrackVideo(this.activeVideo);
                }

                if (!this.activeVideo) {
                        var iterator = this.videos.keys();
                        var next = iterator.next();

                        while (!next.done) {
                                var candidate = next.value;

                                if (candidate.isConnected) {
                                        this.setActiveVideo(candidate);
                                        break;
                                }

                                next = iterator.next();
                        }
                }

                if (!this.activeVideo) {
                        var fallback = document.querySelector('video');

                        if (fallback) {
                                this.trackVideo(fallback);
                                this.setActiveVideo(fallback);
                        }
                }

                return this.activeVideo;
        };

        VideoManager.prototype.setActiveVideo = function (video) {
                if (!(video instanceof HTMLVideoElement)) {
                        return;
                }

                if (!video.isConnected) {
                        return;
                }

                this.activeVideo = video;
                extension.videos.active = video;
        };

        VideoManager.prototype.adjustFramerate = function (delta, event) {
                if (!extension.videos.active) {
                        return;
                }

                var step = event && event.shiftKey ? delta * 10 : delta;

                extension.framerate = Math.max(1, extension.framerate + step);

                try {
                        chrome.storage.local.set({ framerate: extension.framerate });
                } catch (error) {
                        console.warn('Frame-by-Frame: unable to persist framerate', error);
                }

                if (extension.ui && typeof extension.ui.update === 'function') {
                        extension.ui.update();
                }

                if (extension.ui && typeof extension.ui.sleep === 'function') {
                        extension.ui.sleep();
                }
        };

        VideoManager.prototype.scrub = function (direction, event) {
                var video = this.ensureActiveVideo();

                if (!video) {
                        console.warn('Frame-by-Frame: no active video to scrub');
                        return;
                }

                var framerate = extension.framerate || 60;
                var multiplier = event && event.shiftKey ? 10 : 1;
                var frame = multiplier / framerate;

                try {
                        if (video.paused === false) {
                                video.pause();
                                this.wasPlaying = true;
                        }

                        var duration = isNaN(video.duration) ? Infinity : video.duration;
                        var nextTime = video.currentTime + direction * frame;

                        nextTime = Math.max(0, Math.min(duration, nextTime));
                        video.currentTime = nextTime;
                } catch (error) {
                        console.error('Frame-by-Frame: unable to scrub video', error);
                }

                if (extension.ui && typeof extension.ui.sleep === 'function') {
                        extension.ui.sleep();
                }
        };

        VideoManager.prototype.detectFramerate = function () {
                var video = this.ensureActiveVideo();

                if (!video) {
                        console.warn('Frame-by-Frame: no active video to detect framerate');
                        return;
                }

                if (!video.getVideoPlaybackQuality || typeof video.getVideoPlaybackQuality !== 'function') {
                        console.warn('Frame-by-Frame: getVideoPlaybackQuality not supported on this video');
                        return;
                }

                var initialQuality = video.getVideoPlaybackQuality();
                var startFrames = initialQuality.totalVideoFrames;

                if (typeof startFrames !== 'number') {
                        console.warn('Frame-by-Frame: totalVideoFrames is unavailable');
                        return;
                }

                var wasPaused = video.paused;
                var prevRate = video.playbackRate;

                var resume = function () {
                        video.playbackRate = prevRate;

                        if (wasPaused) {
                            video.pause();
                        }
                };

                // Ensure playback for sampling.
                if (wasPaused) {
                        video.play().catch(function () { });
                }

                var startTime = performance.now();
                var self = this;

                setTimeout(function () {
                        var endQuality = video.getVideoPlaybackQuality();
                        var endFrames = endQuality.totalVideoFrames;
                        var elapsed = (performance.now() - startTime) / 1000;
                        var deltaFrames = endFrames - startFrames;

                        resume();

                        if (deltaFrames > 0 && elapsed > 0) {
                                var detectedFps = Math.round(deltaFrames / elapsed);

                                extension.framerate = detectedFps;

                                try {
                                        chrome.storage.local.set({ framerate: detectedFps });
                                } catch (error) {
                                        console.warn('Frame-by-Frame: unable to persist detected framerate', error);
                                }

                                if (extension.ui && typeof extension.ui.update === 'function') {
                                        extension.ui.update();
                                }
                        } else {
                                console.warn('Frame-by-Frame: unable to detect framerate (insufficient frames)');
                        }
                }, 700);
        };

        VideoManager.prototype.destroy = function () {
                if (this.observer) {
                        this.observer.disconnect();
                }

                BODY.removeEventListener('click', this.handleBodyInteraction, true);
                BODY.removeEventListener('pointerdown', this.handleBodyInteraction, true);

                var iterator = this.videos.keys();
                var next = iterator.next();

                while (!next.done) {
                        this.untrackVideo(next.value);
                        next = iterator.next();
                }
        };

        var videoManager = new VideoManager();
        extension.videoManager = videoManager;

        /*--------------------------------------------------------------
        # DATA
        --------------------------------------------------------------*/

        extension.events.clickDrag = {
                x: 0,
                y: 0
        };

        extension.events.clickResize = {
                x: 0,
                y: 0
        };

        /*--------------------------------------------------------------
        # FEATURES
        --------------------------------------------------------------*/

        extension.events.features.increase_framerate = function (event) {
                videoManager.adjustFramerate(1, event);
        };

        extension.events.features.decrease_framerate = function (event) {
                videoManager.adjustFramerate(-1, event);
        };

        extension.events.features.next_shortcut = function (event) {
                videoManager.scrub(1, event);
        };

        extension.events.features.prev_shortcut = function (event) {
                videoManager.scrub(-1, event);
        };

        extension.events.features.hide_shortcut = function () {
                if (extension.videos.active && extension.ui && extension.ui.actions) {
                        extension.ui.actions.toggle();

                        if (typeof extension.ui.sleep === 'function') {
                                extension.ui.sleep();
                        }
                }
        };
})();

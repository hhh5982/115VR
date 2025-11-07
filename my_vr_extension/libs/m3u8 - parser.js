(function () {
    // ast.js内容开始
    function createMediaPlaylist(tag, attributes) {
        return {
            type: 'playlist',
            playlistType:'media',
            tags: [tag],
            attributes: attributes,
            segments: []
        };
    }

    function createMasterPlaylist(tag, attributes) {
        return {
            type: 'playlist',
            playlistType:'master',
            tags: [tag],
            attributes: attributes,
            playlists: []
        };
    }

    function createMedia(tag, attributes) {
        return {
            type:'media',
            tags: [tag],
            attributes: attributes
        };
    }

    function createKey(tag, attributes) {
        return {
            type: 'key',
            tags: [tag],
            attributes: attributes
        };
    }

    function createSegment(tag, attributes, uri) {
        return {
            type:'segment',
            tags: [tag],
            attributes: attributes,
            uri: uri
        };
    }

    function createPlaylist(tag, attributes, uri) {
        return {
            type: 'playlist',
            tags: [tag],
            attributes: attributes,
            uri: uri
        };
    }

    function createMap(tag, attributes, uri) {
        return {
            type:'map',
            tags: [tag],
            attributes: attributes,
            uri: uri
        };
    }

    function createUnknown(tag, attributes) {
        return {
            type: 'unknown',
            tags: [tag],
            attributes: attributes
        };
    }

    function createComment(tag, data) {
        return {
            type: 'comment',
            tag: tag,
            data: data
        };
    }

    function createByteRange(tag, attributes) {
        return {
            type: 'byterange',
            tags: [tag],
            attributes: attributes
        };
    }
    // ast.js内容结束

    // utils.js内容开始
    const hasOwnProperty = Object.prototype.hasOwnProperty;

    function parseAttributes(attrStr) {
        const attributes = {};
        const pairs = attrStr.split(',');
        pairs.forEach((pair) => {
            const parts = pair.split('=');
            const key = parts[0].trim();
            let value = parts[1];
            if (value && value[0] === '"' && value[value.length - 1] === '"') {
                value = value.slice(1, -1);
            }
            attributes[key] = value;
        });
        return attributes;
    }

    function isMasterPlaylist(playlist) {
        return playlist.type === 'playlist' && playlist.playlistType ==='master';
    }

    function isMediaPlaylist(playlist) {
        return playlist.type === 'playlist' && playlist.playlistType ==='media';
    }

    function inherits(child, parent) {
        function Surrogate() { }
        Surrogate.prototype = parent.prototype;
        child.prototype = new Surrogate();
        child.prototype.constructor = child;
    }

    function forEach(obj, fn) {
        if (obj) {
            for (let key in obj) {
                if (hasOwnProperty.call(obj, key)) {
                    fn(obj[key], key, obj);
                }
            }
        }
        return obj;
    }

    function clone(obj) {
        if (!obj) {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.slice();
        }
        if (typeof obj === 'object') {
            const copy = {};
            forEach(obj, (val, key) => {
                copy[key] = clone(val);
            });
            return copy;
        }
        return obj;
    }
    // utils.js内容结束

    // m3u8 - parser.js原始内容开始
    function Parser(options) {
        this.options = options || {};
        this.manifest = null;
        this.lines = [];
        this.tokens = [];
        this.position = 0;
        this.next = null;
        this.remaining = null;
    }

    Parser.prototype.push = function (data) {
        if (typeof data ==='string') {
            this.lines = this.lines.concat(data.split('\n'));
        } else if (Array.isArray(data)) {
            this.lines = this.lines.concat(data);
        }
        this.parse();
    };

    Parser.prototype.end = function () {
        if (this.lines.length > 0) {
            this.parse();
        }
        return this.manifest;
    };

    Parser.prototype.parse = function () {
        let line;
        while (this.lines.length > 0) {
            line = this.lines.shift();
            if (line.charAt(0) === '#') {
                this.parseTag(line);
            } else if (line.length > 0) {
                this.parseURI(line);
            }
        }
    };

    Parser.prototype.parseTag = function (line) {
        const parts = line.split(':', 2);
        const tag = parts[0].substr(1);
        const attributes = parts.length > 1? parseAttributes(parts[1]) : {};
        const ast = this.createAST(tag, attributes);
        if (ast) {
            this.addToManifest(ast);
        }
    };

    Parser.prototype.parseURI = function (uri) {
        if (this.next) {
            if (this.next.type ==='segment') {
                this.next.uri = uri;
            } else if (this.next.type === 'playlist') {
                this.next.uri = uri;
            } else if (this.next.type ==='map') {
                this.next.uri = uri;
            }
            this.addToManifest(this.next);
            this.next = null;
        }
    };

    Parser.prototype.createAST = function (tag, attributes) {
        let ast;
        switch (tag) {
            case 'EXTM3U':
                ast = createMasterPlaylist(tag, attributes);
                break;
            case 'EXT-X-STREAM-INF':
                ast = createPlaylist(tag, attributes);
                this.next = ast;
                break;
            case 'EXT-X-MEDIA':
                ast = createMedia(tag, attributes);
                break;
            case 'EXT-X-KEY':
                ast = createKey(tag, attributes);
                break;
            case 'EXTINF':
                ast = createSegment(tag, attributes);
                this.next = ast;
                break;
            case 'EXT-X-BYTERANGE':
                ast = createByteRange(tag, attributes);
                break;
            case 'EXT-X-PROGRAM-DATE-TIME':
            case 'EXT-X-MAP':
                ast = createMap(tag, attributes);
                this.next = ast;
                break;
            case 'EXT-X-ENDLIST':
                ast = createUnknown(tag, attributes);
                break;
            case 'EXT-X-VERSION':
            case 'EXT-X-TARGETDURATION':
            case 'EXT-X-MEDIA-SEQUENCE':
            case 'EXT-X-DISCONTINUITY':
            case 'EXT-X-DISCONTINUITY-SEQUENCE':
            case 'EXT-X-ALLOW-CACHE':
            case 'EXT-X-PLAYLIST-TYPE':
            case 'EXT-X-START':
            case 'EXT-X-CUE-OUT':
            case 'EXT-X-CUE-OUT-CONT':
            case 'EXT-X-CUE-IN':
            case 'EXT-X-I-FRAME-STREAM-INF':
            case 'EXT-X-I-FRAME-ONLY':
                ast = createUnknown(tag, attributes);
                break;
            case 'EXT-X-COMMENT':
                ast = createComment(tag, attributes.value);
                break;
            default:
                if (tag.substr(0, 4) === 'EXT-') {
                    ast = createUnknown(tag, attributes);
                }
        }
        return ast;
    };

    Parser.prototype.addToManifest = function (ast) {
        if (!this.manifest) {
            this.manifest = ast;
        } else if (isMasterPlaylist(this.manifest)) {
            if (ast.type === 'playlist') {
                this.manifest.playlists.push(ast);
            } else if (ast.type ==='media') {
                this.manifest.media.push(ast);
            }
        } else if (isMediaPlaylist(this.manifest)) {
            if (ast.type ==='segment') {
                this.manifest.segments.push(ast);
            } else if (ast.type === 'key') {
                this.manifest.key = ast;
            } else if (ast.type === 'byterange') {
                this.manifest.byterange = ast;
            } else if (ast.type ==='map') {
                this.manifest.map = ast;
            }
        }
    };

    return {
        Parser: Parser
    };
    // m3u8 - parser.js原始内容结束
})();
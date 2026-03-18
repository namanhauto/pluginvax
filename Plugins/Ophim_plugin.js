// =============================================================================
// 1. CONFIGURATION & METADATA (OPhim API V1)
// =============================================================================
function getManifest() {
    return JSON.stringify({
        "id": "ophim_api",
        "name": "OPhim",
        "version": "1.0.1",
        "baseUrl": "https://ophim1.com",
        "iconUrl": "https://raw.githubusercontent.com/namanhauto/pluginvax/main/Plugins/Ophim_logo.png",
        "isEnabled": true,
        "type": "MOVIE",
        "layoutType": "VERTICAL"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'home', title: '🏠 Phim Mới Cập Nhật', type: 'Banner', path: 'v1/api/home' },
        { slug: 'phim-bo', title: '📺 Phim Bộ', type: 'Grid', path: 'v1/api/danh-sach/phim-bo' },
        { slug: 'phim-le', title: '🎬 Phim Lẻ', type: 'Horizontal', path: 'v1/api/danh-sach/phim-le' },
        { slug: 'tv-shows', title: '🌟 TV Shows', type: 'Horizontal', path: 'v1/api/danh-sach/tv-shows' },
        { slug: 'hoat-hinh', title: '🦄 Hoạt Hình', type: 'Horizontal', path: 'v1/api/danh-sach/hoat-hinh' }
    ]);
}

// =============================================================================
// 2. PARSERS (XỬ LÝ DỮ LIỆU TỪ API)
// =============================================================================

function parseHomeResponse(slug, apiResponseJson) {
    try {
        var res = JSON.parse(apiResponseJson);
        var items = [];
        
        // API V1 trả về dữ liệu trong res.data.items
        var rawItems = (res.data && res.data.items) ? res.data.items : [];
        
        for (var i = 0; i < rawItems.length; i++) {
            var item = rawItems[i];
            items.push({
                name: item.name,
                originName: item.origin_name,
                slug: item.slug,
                thumb: "https://img.phimapi.com/" + item.thumb_url,
                poster: "https://img.phimapi.com/" + item.poster_url,
                label: item.episode_current || item.year
            });
        }
        return JSON.stringify(items);
    } catch (e) { return "[]"; }
}

function parseSearchResponse(apiResponseJson) {
    return parseHomeResponse('search', apiResponseJson);
}

function parseDetailResponse(apiResponseJson) {
    try {
        var res = JSON.parse(apiResponseJson);
        var movie = res.data.item;
        
        // Xử lý danh sách tập phim
        var servers = [];
        if (movie.episodes) {
            for (var i = 0; i < movie.episodes.length; i++) {
                var serverItem = movie.episodes[i];
                var episodes = [];
                for (var j = 0; j < serverItem.server_data.length; j++) {
                    var ep = serverItem.server_data[j];
                    episodes.push({
                        name: ep.name,
                        url: ep.link_m3u8 // API V1 cung cấp trực tiếp link m3u8
                    });
                }
                servers.push({
                    serverName: serverItem.server_name,
                    serverItems: episodes
                });
            }
        }

        return JSON.stringify({
            name: movie.name,
            originName: movie.origin_name,
            thumb: "https://img.phimapi.com/" + movie.thumb_url,
            poster: "https://img.phimapi.com/" + movie.poster_url,
            description: movie.content.replace(/<[^>]*>?/gm, ''),
            year: movie.year,
            status: movie.episode_current,
            duration: movie.time,
            servers: servers,
            director: movie.director ? movie.director.join(', ') : "",
            casts: movie.actor ? movie.actor.join(', ') : ""
        });
    } catch (error) { return "null"; }
}

// Link video trực tiếp từ server OPhim không cần parse thêm
function parseVideoResponse(apiResponseJson) {
    return JSON.stringify({
        url: "", 
        headers: { "User-Agent": "Mozilla/5.0" }
    });
}

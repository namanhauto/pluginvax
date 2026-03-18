// =============================================================================
// 1. CONFIGURATION & METADATA (OPhim API V1 CHUẨN)
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
        { slug: 'v1/api/home', title: '🏠 Phim Mới Cập Nhật', type: 'Banner', path: 'v1/api/home' },
        { slug: 'v1/api/danh-sach/phim-bo', title: '📺 Phim Bộ', type: 'Horizontal', path: 'v1/api/danh-sach/phim-bo' },
        { slug: 'v1/api/danh-sach/phim-le', title: '🎬 Phim Lẻ', type: 'Horizontal', path: 'v1/api/danh-sach/phim-le' },
        { slug: 'v1/api/danh-sach/hoat-hinh', title: '🦄 Hoạt Hình', type: 'Horizontal', path: 'v1/api/danh-sach/hoat-hinh' }
    ]);
}

// =============================================================================
// 2. HELPER: SỬA LỖI HÌNH ẢNH (CHUYỂN SANG IMG.PHIMAPI.COM)
// =============================================================================
function fixImageUrl(path) {
    if (!path) return "";
    if (path.indexOf('http') === 0) return path;
    // API V1 của OPhim bắt buộc dùng host img.phimapi.com
    var cleanPath = path.replace(/^\/+/, '');
    return "https://img.phimapi.com/" + cleanPath; 
}

// =============================================================================
// 3. URL GENERATION (BÁM SÁT ĐƯỜNG DẪN API V1)
// =============================================================================
function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        
        // Nếu dùng bộ lọc
        if (filters.category) return "https://ophim1.com/v1/api/the-loai/" + filters.category + "?page=" + page;
        if (filters.country) return "https://ophim1.com/v1/api/quoc-gia/" + filters.country + "?page=" + page;
        if (filters.year) return "https://ophim1.com/v1/api/nam-phat-hanh/" + filters.year + "?page=" + page;

        // Xử lý slug từ Home Section
        if (slug.indexOf('v1/api') === 0) {
            return "https://ophim1.com/" + slug + (slug.indexOf('?') > -1 ? "&" : "?") + "page=" + page;
        }
        
        return "https://ophim1.com/v1/api/danh-sach/" + slug + "?page=" + page;
    } catch (e) {
        return "https://ophim1.com/v1/api/home";
    }
}

function getUrlSearch(keyword, filtersJson) {
    var page = JSON.parse(filtersJson || "{}").page || 1;
    return "https://ophim1.com/v1/api/tim-kiem?keyword=" + encodeURIComponent(keyword) + "&page=" + page;
}

function getUrlDetail(slug) {
    return "https://ophim1.com/v1/api/phim/" + slug;
}

function getUrlCategories() { return "https://ophim1.com/v1/api/the-loai"; }
function getUrlCountries() { return "https://ophim1.com/v1/api/quoc-gia"; }
function getUrlYears() { return "https://ophim1.com/v1/api/nam-phat-hanh"; }

// =============================================================================
// 4. PARSERS (BÓC TÁCH DỮ LIỆU CHUẨN V1)
// =============================================================================
function parseListResponse(apiResponseJson) {
    try {
        var res = JSON.parse(apiResponseJson);
        var items = [];
        var rawData = res.data ? (res.data.items || []) : [];

        for (var i = 0; i < rawData.length; i++) {
            var item = rawData[i];
            items.push({
                id: item.slug,
                title: item.name,
                posterUrl: fixImageUrl(item.poster_url),
                backdropUrl: fixImageUrl(item.thumb_url),
                year: item.year || 0,
                quality: item.quality || "FHD",
                episode_current: item.episode_current || "Full",
                lang: item.lang || ""
            });
        }

        return JSON.stringify({
            items: items,
            pagination: (res.data && res.data.params) ? res.data.params.pagination : { currentPage: 1, totalPages: 1 }
        });
    } catch (e) { return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } }); }
}

function parseSearchResponse(apiResponseJson) { return parseListResponse(apiResponseJson); }

function parseMovieDetail(apiResponseJson) {
    try {
        var res = JSON.parse(apiResponseJson);
        var movie = res.data.item;
        
        var servers = (movie.episodes || []).map(function(server) {
            return {
                name: server.server_name,
                episodes: server.server_data.map(function(ep) {
                    return { id: ep.link_m3u8, name: ep.name, slug: ep.slug };
                })
            };
        });

        var tmdbId = (movie.tmdb && movie.tmdb.id) ? String(movie.tmdb.id) : "";

        return JSON.stringify({
            id: movie.slug,
            title: movie.name,
            originName: movie.origin_name,
            posterUrl: fixImageUrl(movie.poster_url),
            backdropUrl: fixImageUrl(movie.thumb_url),
            description: movie.content ? movie.content.replace(/<[^>]*>?/gm, '') : "",
            year: movie.year,
            quality: movie.quality || "FHD",
            rating: (movie.tmdb && movie.tmdb.vote_average) ? movie.tmdb.vote_average : 0,
            category: (movie.category || []).map(function(c) { return c.name; }).join(", "),
            country: (movie.country || []).map(function(c) { return c.name; }).join(", "),
            casts: (movie.actor || []).join(", "),
            director: (movie.director || []).join(", "),
            tmdbId: tmdbId,
            servers: servers
        });
    } catch (e) { return "null"; }
}

function parseDetailResponse(apiResponseJson) {
    return JSON.stringify({ url: "", headers: { "Referer": "https://ophim1.com/" } });
}

function parseCategoriesResponse(apiResponseJson) {
    try {
        var res = JSON.parse(apiResponseJson);
        var list = (res.data && res.data.items) ? res.data.items : [];
        return JSON.stringify(list.map(function(i) { return { name: i.name, slug: i.slug, value: i.slug }; }));
    } catch (e) { return "[]"; }
}

function parseCountriesResponse(apiResponseJson) { return parseCategoriesResponse(apiResponseJson); }

function parseYearsResponse(apiResponseJson) {
    try {
        var res = JSON.parse(apiResponseJson);
        var list = (res.data && res.data.items) ? res.data.items : [];
        return JSON.stringify(list.map(function(i) { return { name: i.name, slug: i.name, value: i.name }; }));
    } catch (e) { return "[]"; }
}

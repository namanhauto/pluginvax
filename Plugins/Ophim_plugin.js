// =============================================================================
// 1. CONFIGURATION & METADATA (OPhim API V1 CHUẨN HÓA)
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
        { slug: 'phim-bo', title: '📺 Phim Bộ', type: 'Horizontal', path: 'v1/api/danh-sach/phim-bo' },
        { slug: 'phim-le', title: '🎬 Phim Lẻ', type: 'Horizontal', path: 'v1/api/danh-sach/phim-le' },
        { slug: 'hoat-hinh', title: '🦄 Hoạt Hình', type: 'Horizontal', path: 'v1/api/danh-sach/hoat-hinh' }
    ]);
}

// =============================================================================
// 2. HELPER: SỬA LỖI HÌNH ẢNH (QUAN TRỌNG NHẤT)
// =============================================================================
function fixImageUrl(path) {
    if (!path) return "";
    if (path.indexOf('http') === 0) return path; // Nếu có http rồi thì lấy luôn
    // Xóa dấu gạch chéo ở đầu nếu có để tránh lỗi double slash
    var cleanPath = path.replace(/^\/+/, '');
    return "https://phimimg.com/" + cleanPath; // Server ảnh chuẩn của OPhim/KKPhim
}

// =============================================================================
// 3. URL GENERATION
// =============================================================================
function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        if (filters.category) return "https://ophim1.com/v1/api/the-loai/" + filters.category + "?page=" + page;
        if (filters.country) return "https://ophim1.com/v1/api/quoc-gia/" + filters.country + "?page=" + page;
        if (filters.year) return "https://ophim1.com/v1/api/nam-phat-hanh/" + filters.year + "?page=" + page;
        if (slug === 'home') return "https://ophim1.com/v1/api/home?page=" + page;
        return "https://ophim1.com/" + slug + "?page=" + page;
    } catch (e) { return "https://ophim1.com/v1/api/home"; }
}

function getUrlSearch(keyword, filtersJson) {
    var page = JSON.parse(filtersJson || "{}").page || 1;
    return "https://ophim1.com/v1/api/tim-kiem?keyword=" + encodeURIComponent(keyword) + "&page=" + page;
}

function getUrlDetail(slug) { return "https://ophim1.com/v1/api/phim/" + slug; }
function getUrlCategories() { return "https://ophim1.com/v1/api/the-loai"; }
function getUrlCountries() { return "https://ophim1.com/v1/api/quoc-gia"; }
function getUrlYears() { return "https://ophim1.com/v1/api/nam-phat-hanh"; }

// =============================================================================
// 4. PARSERS
// =============================================================================
function parseListResponse(apiResponseJson) {
    try {
        var res = JSON.parse(apiResponseJson);
        var data = res.data || {};
        var rawItems = data.items || [];
        var items = rawItems.map(function(item) {
            return {
                id: item.slug,
                title: item.name,
                posterUrl: fixImageUrl(item.poster_url),
                backdropUrl: fixImageUrl(item.thumb_url),
                year: item.year || 0,
                quality: item.quality || "FHD", // List V1 không có quality, ta để FHD cho đẹp
                episode_current: item.episode_current || "Full",
                lang: item.lang || ""
            };
        });
        return JSON.stringify({ items: items, pagination: data.params ? data.params.pagination : { currentPage: 1, totalPages: 1 } });
    } catch (e) { return JSON.stringify({ items: [] }); }
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

        // Bóc tách TMDB ID để App tự lấy ảnh diễn viên và điểm IMDb nếu App hỗ trợ
        var tmdbId = "";
        if (movie.tmdb && movie.tmdb.id) tmdbId = String(movie.tmdb.id);

        return JSON.stringify({
            id: movie.slug,
            title: movie.name,
            originName: movie.origin_name,
            posterUrl: fixImageUrl(movie.poster_url),
            backdropUrl: fixImageUrl(movie.thumb_url),
            description: movie.content ? movie.content.replace(/<[^>]*>?/gm, '') : "",
            year: movie.year,
            quality: movie.quality || "FHD", // Ở chi tiết sẽ có chất lượng thật
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
        var list = (res.data && res.data.items) ? res.data.items : (res.items || []);
        return JSON.stringify(list.map(function(i) { return { name: i.name, slug: i.slug, value: i.slug }; }));
    } catch (e) { return "[]"; }
}

function parseCountriesResponse(apiResponseJson) { return parseCategoriesResponse(apiResponseJson); }

function parseYearsResponse(apiResponseJson) {
    try {
        var res = JSON.parse(apiResponseJson);
        var list = (res.data && res.data.items) ? res.data.items : (res.items || []);
        return JSON.stringify(list.map(function(i) { return { name: i.name, slug: i.name, value: i.name }; }));
    } catch (e) { return "[]"; }
}

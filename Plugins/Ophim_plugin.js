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
        // Sử dụng API Home chuẩn của V1
        { slug: 'home', title: '🏠 Phim Mới Cập Nhật', type: 'Banner', path: 'v1/api/home' },
        { slug: 'phim-bo', title: '📺 Phim Bộ', type: 'Horizontal', path: 'v1/api/danh-sach/phim-bo' },
        { slug: 'phim-le', title: '🎬 Phim Lẻ', type: 'Horizontal', path: 'v1/api/danh-sach/phim-le' },
        { slug: 'hoat-hinh', title: '🦄 Hoạt Hình', type: 'Horizontal', path: 'v1/api/danh-sach/hoat-hinh' },
        { slug: 'tv-shows', title: '🌟 TV Shows', type: 'Horizontal', path: 'v1/api/danh-sach/tv-shows' }
    ]);
}

// =============================================================================
// 2. URL GENERATION (BỘ ĐỊNH TUYẾN THEO TÀI LIỆU API V1)
// =============================================================================
function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        
        // Ưu tiên bộ lọc nếu có
        if (filters.category) return "https://ophim1.com/v1/api/the-loai/" + filters.category + "?page=" + page;
        if (filters.country) return "https://ophim1.com/v1/api/quoc-gia/" + filters.country + "?page=" + page;
        if (filters.year) return "https://ophim1.com/v1/api/nam-phat-hanh/" + filters.year + "?page=" + page;

        // Nếu là Home thì gọi API home, còn lại gọi danh-sach
        if (slug === 'home') return "https://ophim1.com/v1/api/home";
        return "https://ophim1.com/" + slug + "?page=" + page;
    } catch (e) {
        return "https://ophim1.com/v1/api/home";
    }
}

function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    return "https://ophim1.com/v1/api/tim-kiem?keyword=" + encodeURIComponent(keyword) + "&page=" + page;
}

function getUrlDetail(slug) {
    return "https://ophim1.com/v1/api/phim/" + slug;
}

function getUrlCategories() { return "https://ophim1.com/v1/api/the-loai"; }
function getUrlCountries() { return "https://ophim1.com/v1/api/quoc-gia"; }
function getUrlYears() { return "https://ophim1.com/v1/api/nam-phat-hanh"; }

// =============================================================================
// 3. PARSERS (BÓC TÁCH DỮ LIỆU)
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
                posterUrl: "https://img.phimapi.com/" + item.poster_url,
                backdropUrl: "https://img.phimapi.com/" + item.thumb_url,
                year: item.year || 0,
                quality: item.quality || "FHD",
                episode_current: item.episode_current || "Full",
                lang: item.lang || ""
            };
        });

        return JSON.stringify({
            items: items,
            pagination: data.params ? data.params.pagination : { currentPage: 1, totalPages: 1 }
        });
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
                    return {
                        id: ep.link_m3u8,
                        name: ep.name,
                        slug: ep.slug
                    };
                })
            };
        });

        return JSON.stringify({
            id: movie.slug,
            title: movie.name,
            originName: movie.origin_name,
            posterUrl: "https://img.phimapi.com/" + movie.poster_url,
            backdropUrl: "https://img.phimapi.com/" + movie.thumb_url,
            description: movie.content.replace(/<[^>]*>?/gm, ''),
            year: movie.year,
            quality: movie.quality,
            category: (movie.category || []).map(function(c) { return c.name; }).join(", "),
            country: (movie.country || []).map(function(c) { return c.name; }).join(", "),
            casts: (movie.actor || []).join(", "),
            director: (movie.director || []).join(", "),
            servers: servers
        });
    } catch (e) { return "null"; }
}

function parseDetailResponse(apiResponseJson) {
    return JSON.stringify({
        url: "", // App tự lấy từ ID tập phim
        headers: { "Referer": "https://ophim1.com/" }
    });
}

function parseCategoriesResponse(apiResponseJson) {
    try {
        var res = JSON.parse(apiResponseJson);
        return JSON.stringify((res.data && res.data.items) ? res.data.items.map(function(i) { return { name: i.name, slug: i.slug, value: i.slug }; }) : []);
    } catch (e) { return "[]"; }
}

function parseCountriesResponse(apiResponseJson) { return parseCategoriesResponse(apiResponseJson); }

function parseYearsResponse(apiResponseJson) {
    try {
        var res = JSON.parse(apiResponseJson);
        return JSON.stringify((res.data && res.data.items) ? res.data.items.map(function(i) { return { name: i.name, slug: i.name, value: i.name }; }) : []);
    } catch (e) { return "[]"; }
}

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
        // ĐÃ SỬA LỖI SLUG (Tuyệt đối không dùng dấu gạch chéo ở đây)
        { slug: 'phim-moi', title: '🏠 Phim Mới Cập Nhật', type: 'Banner', path: 'danh-sach' },
        { slug: 'phim-bo', title: '📺 Phim Bộ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-le', title: '🎬 Phim Lẻ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'hoat-hinh', title: '🦄 Hoạt Hình', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'tv-shows', title: '🌟 TV Shows', type: 'Horizontal', path: 'danh-sach' }
    ]);
}

// =============================================================================
// 2. URL GENERATION (ĐỊNH TUYẾN THÔNG MINH)
// =============================================================================
function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        
        // Chạy Bộ lọc
        if (filters.category) return "https://ophim1.com/v1/api/the-loai/" + filters.category + "?page=" + page;
        if (filters.country) return "https://ophim1.com/v1/api/quoc-gia/" + filters.country + "?page=" + page;
        if (filters.year) return "https://ophim1.com/v1/api/nam-phat-hanh/" + filters.year + "?page=" + page;

        // Phim mới cập nhật phải dùng link riêng để Load More không bị lỗi
        if (slug === 'phim-moi') {
            return "https://ophim1.com/danh-sach/phim-moi-cap-nhat?page=" + page; 
        }
        
        // Các danh sách khác (Phim bộ, Phim lẻ...) dùng chuẩn V1
        return "https://ophim1.com/v1/api/danh-sach/" + slug + "?page=" + page;
    } catch (e) {
        return "https://ophim1.com/danh-sach/phim-moi-cap-nhat";
    }
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
// 3. PARSERS (BÓC TÁCH "BAO CÂN" MỌI LỖI TỪ API)
// =============================================================================
function parseListResponse(apiResponseJson) {
    try {
        var res = JSON.parse(apiResponseJson);
        var rawItems = [];
        var pagination = { currentPage: 1, totalPages: 1 };
        var domainImage = "https://img.phimapi.com/"; // Domain dự phòng

        // Code bắt thông minh: Tự thích ứng với cấu trúc API V0 (Phim mới) và V1 (Danh sách)
        if (res.data && res.data.items) {
            rawItems = res.data.items;
            pagination = (res.data.params && res.data.params.pagination) ? res.data.params.pagination : pagination;
            if (res.data.APP_DOMAIN_CDN_IMAGE) domainImage = res.data.APP_DOMAIN_CDN_IMAGE + "/"; // Lấy server ảnh gốc của OPhim
        } else if (res.items) {
            rawItems = res.items;
            pagination = res.pagination || pagination;
            if (res.pathImage) domainImage = res.pathImage + "/";
        }

        var items = rawItems.map(function(item) {
            // Fix triệt để lỗi ảnh vỡ
            var poster = item.poster_url.indexOf('http') === 0 ? item.poster_url : domainImage + item.poster_url.replace(/^\/+/, '');
            var thumb = item.thumb_url.indexOf('http') === 0 ? item.thumb_url : domainImage + item.thumb_url.replace(/^\/+/, '');
            
            return {
                id: item.slug,
                title: item.name,
                posterUrl: poster,
                backdropUrl: thumb,
                year: item.year || 0,
                quality: item.quality || "FHD",
                episode_current: item.episode_current || "Full",
                lang: item.lang || ""
            };
        });

        return JSON.stringify({ items: items, pagination: pagination });
    } catch (e) { return JSON.stringify({ items: [] }); }
}

function parseSearchResponse(apiResponseJson) { return parseListResponse(apiResponseJson); }

function parseMovieDetail(apiResponseJson) {
    try {
        var res = JSON.parse(apiResponseJson);
        // Tương thích cả V0 và V1
        var movie = res.status ? res.data.item : res.movie; 
        if (!movie) return "null";

        var domainImage = "https://img.phimapi.com/";
        if (res.data && res.data.APP_DOMAIN_CDN_IMAGE) domainImage = res.data.APP_DOMAIN_CDN_IMAGE + "/";
        else if (res.pathImage) domainImage = res.pathImage + "/";

        var poster = movie.poster_url.indexOf('http') === 0 ? movie.poster_url : domainImage + movie.poster_url.replace(/^\/+/, '');
        var thumb = movie.thumb_url.indexOf('http') === 0 ? movie.thumb_url : domainImage + movie.thumb_url.replace(/^\/+/, '');

        var episodesRaw = res.status ? movie.episodes : res.episodes;
        var servers = (episodesRaw || []).map(function(server) {
            return {
                name: server.server_name,
                episodes: server.server_data.map(function(ep) {
                    return { id: ep.link_m3u8, name: ep.name, slug: ep.slug };
                })
            };
        });

        // Hỗ trợ App VAAPP vẽ ảnh diễn viên và điểm IMDb
        var tmdbId = (movie.tmdb && movie.tmdb.id) ? String(movie.tmdb.id) : "";

        return JSON.stringify({
            id: movie.slug,
            title: movie.name,
            originName: movie.origin_name,
            posterUrl: poster,
            backdropUrl: thumb,
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

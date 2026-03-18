// =============================================================================
// 1. CONFIGURATION & METADATA
// =============================================================================
function getManifest() {
    return JSON.stringify({
        "id": "kkphim_api",
        "name": "KKPhim",
        "version": "1.0.0",
        "baseUrl": "https://phimapi.com",
        "iconUrl": "https://kkphim1.com/favicon.ico",
        "isEnabled": true,
        "type": "MOVIE",
        "layoutType": "VERTICAL"
    });
}

function getHomeSections() {
    return JSON.stringify([
        // Phim mới cập nhật V3 lấy API riêng nên để type Grid hoặc Banner
        { slug: 'phim-moi-cap-nhat-v3', title: '🔥 Phim Mới Cập Nhật', type: 'Banner', path: 'danh-sach' },
        { slug: 'phim-bo', title: 'Phim Bộ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-le', title: 'Phim Lẻ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'tv-shows', title: 'TV Shows', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'hoat-hinh', title: 'Hoạt Hình', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-chieu-rap', title: 'Phim Chiếu Rạp', type: 'Horizontal', path: 'danh-sach' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Hành Động', slug: 'hanh-dong' },
        { name: 'Tình Cảm', slug: 'tinh-cam' },
        { name: 'Cổ Trang', slug: 'co-trang' },
        { name: 'Kinh Dị', slug: 'kinh-di' },
        { name: 'Hài Hước', slug: 'hai-huoc' },
        { name: 'Hình Sự', slug: 'hinh-su' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Thời gian cập nhật', value: 'modified.time' },
            { name: 'Năm phát hành', value: 'year' },
            { name: 'Theo ID phim', value: '_id' }
        ],
        // Khi gọi qua API v1, bộ lọc sẽ dùng chung 1 URL tổng hợp
        filter: [
            { name: 'Vietsub', value: 'vietsub' },
            { name: 'Thuyết Minh', value: 'thuyet-minh' },
            { name: 'Lồng Tiếng', value: 'long-tieng' }
        ]
    });
}

// =============================================================================
// 2. URL GENERATION (ĐỘNG BỘ LỌC TỪ API)
// =============================================================================
function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        
        // Link đặc biệt cho danh sách phim mới
        if (slug === 'phim-moi-cap-nhat-v3') {
            return "https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3?page=" + page;
        }

        // Tạo API chuẩn cho bộ lọc V1
        var basePath = "danh-sach";
        var listSlugs = ['phim-vietsub', 'phim-thuyet-minh', 'phim-long-tieng', 'phim-bo', 'phim-le', 'hoat-hinh', 'tv-shows', 'phim-chieu-rap'];
        if (listSlugs.indexOf(slug) === -1) {
            basePath = "the-loai";
        }
        
        var url = "https://phimapi.com/v1/api/" + basePath + "/" + slug + "?page=" + page + "&limit=24";

        if (filters.sort) url += "&sort_field=" + filters.sort;
        if (filters.filter) url += "&sort_lang=" + filters.filter;
        if (filters.category) url += "&category=" + filters.category;
        if (filters.country) url += "&country=" + filters.country;
        if (filters.year) url += "&year=" + filters.year;

        return url;
    } catch (e) {
        return "https://phimapi.com/v1/api/danh-sach/" + slug + "?page=1";
    }
}

function getUrlSearch(keyword, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        return "https://phimapi.com/v1/api/tim-kiem?keyword=" + encodeURIComponent(keyword) + "&page=" + page + "&limit=24";
    } catch (e) {
        return "https://phimapi.com/v1/api/tim-kiem?keyword=" + encodeURIComponent(keyword) + "&limit=24";
    }
}

function getUrlDetail(slug) {
    return "https://phimapi.com/phim/" + slug;
}

// Bắt danh sách Thể loại, Quốc gia trực tiếp từ API gốc
function getUrlCategories() { return "https://phimapi.com/the-loai"; }
function getUrlCountries() { return "https://phimapi.com/quoc-gia"; }
function getUrlYears() { 
    // Do API không có Endpoint năm riêng, ta giả lập trả về mảng Json chứa Năm
    return "local://years"; 
}

// =============================================================================
// 3. PARSERS (BÓC TÁCH JSON NHANH NHƯ CHỚP)
// =============================================================================
function getPosterUrl(path) {
    if (!path) return "";
    if (path.indexOf("http") === 0) return path;
    return "https://phimapi.com/image.php?url=https://phimimg.com/" + path; // Auto convert sang webp siêu nhẹ
}

function parseListResponse(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var data = response.data || {};
        var items = data.items || response.items || [];
        var params = data.params || {};
        var pagination = response.pagination || params.pagination || {};

        var movies = items.map(function(item) {
            return {
                id: item.slug,
                title: item.name,
                posterUrl: getPosterUrl(item.poster_url),
                backdropUrl: getPosterUrl(item.thumb_url),
                year: item.year || 0,
                quality: item.quality || "HD",
                episode_current: item.episode_current || "",
                lang: item.lang || ""
            };
        });

        return JSON.stringify({
            items: movies,
            pagination: {
                currentPage: pagination.currentPage || 1,
                totalPages: Math.ceil((pagination.totalItems || 0) / (pagination.totalItemsPerPage || 24)) || 1,
                totalItems: pagination.totalItems || 0,
                itemsPerPage: pagination.totalItemsPerPage || 24
            }
        });
    } catch (error) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(apiResponseJson) {
    return parseListResponse(apiResponseJson);
}

function parseMovieDetail(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var movie = response.movie || {};
        var episodes = response.episodes || [];

        // Đóng gói danh sách Server và Tập phim
        var servers = [];
        episodes.forEach(function(server) {
            var serverEpisodes = [];
            if (server.server_data) {
                server.server_data.forEach(function(ep) {
                    serverEpisodes.push({
                        id: ep.link_m3u8 || ep.link_embed, // Lấy m3u8 luôn làm ID (khi play sẽ gọi parseDetailResponse lấy ra)
                        name: ep.name,
                        slug: ep.slug
                    });
                });
            }
            if (serverEpisodes.length > 0) {
                servers.push({ name: server.server_name, episodes: serverEpisodes });
            }
        });

        // Bóc tách siêu dễ dàng nhờ JSON
        var categories = (movie.category || []).map(function(c) { return c.name; }).join(", ");
        var countries = (movie.country || []).map(function(c) { return c.name; }).join(", ");
        var directors = (movie.director || []).join(", ");
        var actors = (movie.actor || []).join(", ");

        var ratingValue = 0;
        var tmdbId = "";
        if (movie.tmdb) {
            if (movie.tmdb.vote_average) ratingValue = movie.tmdb.vote_average;
            if (movie.tmdb.id) tmdbId = movie.tmdb.id;
        }

        return JSON.stringify({
            id: movie.slug,
            title: movie.name,
            originName: movie.origin_name || "",
            posterUrl: getPosterUrl(movie.poster_url),
            backdropUrl: getPosterUrl(movie.thumb_url),
            description: (movie.content || "").replace(/<[^>]*>/g, ""), // Xóa các thẻ HTML rác
            year: movie.year || 0,
            rating: ratingValue,       // <--- Điểm TMDb sẽ hiện ở đây!
            quality: movie.quality || "HD",
            duration: movie.time || "",
            servers: servers,
            category: categories,
            country: countries,
            director: directors,
            casts: actors,             // <--- Diễn viên sẽ hiện ở đây!
            tmdbId: String(tmdbId)
        });
    } catch (error) { 
        return "null"; 
    }
}

function parseDetailResponse(apiResponseJson) {
    // Vì lúc cào chi tiết, ta đã nhét URL m3u8 vào mục 'id' của tập phim
    // Ở App VAAPP, API này sẽ nhận cái ID đó
    return JSON.stringify({
        url: "", // Để trống, App sẽ tự dùng ID (là link m3u8) để Play
        headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://phimapi.com/" 
        },
        subtitles: []
    });
}

function parseCategoriesResponse(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        return JSON.stringify((response || []).map(function(i) { return { name: i.name, slug: i.slug, value: i.slug }; }));
    } catch (e) { return "[]"; }
}

function parseCountriesResponse(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        return JSON.stringify((response || []).map(function(i) { return { name: i.name, slug: i.slug, value: i.slug }; }));
    } catch (e) { return "[]"; }
}

function parseYearsResponse(apiResponseJson) {
    // API không có endpoint Year, ta tự tạo Local Mảng năm
    var years = [];
    for (var i = new Date().getFullYear(); i >= 2000; i--) {
        years.push({ name: i.toString(), slug: i.toString(), value: i.toString() });
    }
    return JSON.stringify(years);
}
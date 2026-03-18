// =============================================================================
// 1. CONFIGURATION & METADATA (OPhim API)
// =============================================================================
function getManifest() {
    return JSON.stringify({
        "id": "ophim_api",
        "name": "OPhim",
        "version": "1.0.1",
        "baseUrl": "https://ophim1.com",
        "iconUrl": "https://raw.githubusercontent.com/namanhauto/pluginvax/main/Plugins/Ophim_logo.png", // Thay logo cho chuẩn
        "isEnabled": true,
        "type": "MOVIE",
        "layoutType": "VERTICAL"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim-moi-cap-nhat', title: '🔥 Phim Mới Cập Nhật', type: 'Banner', path: 'danh-sach' },
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
        filter: [
            { name: 'Vietsub', value: 'vietsub' },
            { name: 'Thuyết Minh', value: 'thuyet-minh' },
            { name: 'Lồng Tiếng', value: 'long-tieng' }
        ]
    });
}

// =============================================================================
// 2. URL GENERATION (BỘ ĐỊNH TUYẾN CHUẨN OPHIM)
// =============================================================================
function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        
        // OPhim dùng link riêng cho Phim mới cập nhật
        if (slug === 'phim-moi-cap-nhat') {
            return "https://ophim1.com/danh-sach/phim-moi-cap-nhat?page=" + page;
        }

        var basePath = "danh-sach";
        var listSlugs = ['phim-vietsub', 'phim-thuyet-minh', 'phim-long-tieng', 'phim-bo', 'phim-le', 'hoat-hinh', 'tv-shows', 'phim-chieu-rap'];
        if (listSlugs.indexOf(slug) === -1) {
            basePath = "the-loai";
        }
        
        var url = "https://ophim1.com/v1/api/" + basePath + "/" + slug + "?page=" + page + "&limit=24";

        if (filters.sort) url += "&sort_field=" + filters.sort;
        if (filters.filter) url += "&sort_lang=" + filters.filter;
        if (filters.category) url += "&category=" + filters.category;
        if (filters.country) url += "&country=" + filters.country;
        if (filters.year) url += "&year=" + filters.year;

        return url;
    } catch (e) {
        return "https://ophim1.com/v1/api/danh-sach/" + slug + "?page=1";
    }
}

function getUrlSearch(keyword, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        return "https://ophim1.com/v1/api/tim-kiem?keyword=" + encodeURIComponent(keyword) + "&page=" + page + "&limit=24";
    } catch (e) {
        return "https://ophim1.com/v1/api/tim-kiem?keyword=" + encodeURIComponent(keyword) + "&limit=24";
    }
}

function getUrlDetail(slug) {
    return "https://ophim1.com/phim/" + slug;
}

function getUrlCategories() { return "https://ophim1.com/the-loai"; }
function getUrlCountries() { return "https://ophim1.com/quoc-gia"; }
function getUrlYears() { return "local://years"; }

// =============================================================================
// 3. PARSERS (BÓC TÁCH JSON OPHIM)
// =============================================================================

// Hàm này xử lý ảnh vì OPhim có lúc trả về path tĩnh, có lúc trả về full link
function getPosterUrl(path, domainImage) {
    if (!path) return "";
    if (path.indexOf("http") === 0) return path;
    var domain = domainImage ? domainImage : "https://img.ophim.live/uploads/movies/";
    return domain + path;
}

function parseListResponse(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var data = response.data || {};
        var items = data.items || response.items || [];
        var params = data.params || {};
        var pagination = response.pagination || params.pagination || {};
        var domainImage = response.pathImage || data.APP_DOMAIN_CDN_IMAGE || "";

        var movies = items.map(function(item) {
            return {
                id: item.slug,
                title: item.name,
                posterUrl: getPosterUrl(item.poster_url, domainImage),
                backdropUrl: getPosterUrl(item.thumb_url, domainImage),
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
        var domainImage = response.pathImage || "";

        var servers = [];
        episodes.forEach(function(server) {
            var serverEpisodes = [];
            if (server.server_data) {
                server.server_data.forEach(function(ep) {
                    serverEpisodes.push({
                        id: ep.link_m3u8 || ep.link_embed, 
                        name: ep.name,
                        slug: ep.slug
                    });
                });
            }
            if (serverEpisodes.length > 0) {
                servers.push({ name: server.server_name, episodes: serverEpisodes });
            }
        });

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
            posterUrl: getPosterUrl(movie.poster_url, domainImage),
            backdropUrl: getPosterUrl(movie.thumb_url, domainImage),
            description: (movie.content || "").replace(/<[^>]*>/g, ""), 
            year: movie.year || 0,
            rating: ratingValue,       
            quality: movie.quality || "HD",
            duration: movie.time || "",
            servers: servers,
            category: categories,
            country: countries,
            director: directors,
            casts: actors,             
            tmdbId: String(tmdbId)
        });
    } catch (error) { 
        return "null"; 
    }
}

function parseDetailResponse(apiResponseJson) {
    return JSON.stringify({
        url: "", // App VAAPP sẽ tự động lấy link M3U8 từ phần ID tập phim ở trên
        headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Origin": "https://ophim1.com/" 
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
    var years = [];
    for (var i = new Date().getFullYear(); i >= 2000; i--) {
        years.push({ name: i.toString(), slug: i.toString(), value: i.toString() });
    }
    return JSON.stringify(years);
}

// =============================================================================
// 1. CONFIGURATION & METADATA (OPHIM API V1)
// =============================================================================
function getManifest() {
    return JSON.stringify({
        "id": "ophim_api", // Hãy chắc chắn id này giống 100% trong plugins.json
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
        { slug: 'phim-moi-cap-nhat', title: '🔥 Phim Mới Cập Nhật', type: 'Banner', path: 'danh-sach' },
        { slug: 'phim-bo', title: '📺 Phim Bộ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-le', title: '🎬 Phim Lẻ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'tv-shows', title: '🌟 TV Shows', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'hoat-hinh', title: '🦄 Hoạt Hình', type: 'Horizontal', path: 'danh-sach' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Hành Động', slug: 'hanh-dong' },
        { name: 'Tình Cảm', slug: 'tinh-cam' },
        { name: 'Cổ Trang', slug: 'co-trang' },
        { name: 'Kinh Dị', slug: 'kinh-di' },
        { name: 'Hài Hước', slug: 'hai-huoc' },
        { name: 'Phiêu Lưu', slug: 'phieu-luu' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Thời gian cập nhật', value: 'modified.time' },
            { name: 'Năm phát hành', value: 'year' },
            { name: 'Theo ID phim', value: '_id' }
        ]
    });
}

// =============================================================================
// 2. URL GENERATION (BỘ ĐỊNH TUYẾN CHUẨN API V1)
// =============================================================================
function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        var finalUrl = "https://ophim1.com/v1/api/danh-sach/" + slug + "?page=" + page + "&limit=24";

        // Nếu người dùng chọn bộ lọc, Ưu tiên thay đổi link
        if (filters.category && filters.category !== "") {
            finalUrl = "https://ophim1.com/v1/api/the-loai/" + filters.category + "?page=" + page + "&limit=24";
        } else if (filters.country && filters.country !== "") {
            finalUrl = "https://ophim1.com/v1/api/quoc-gia/" + filters.country + "?page=" + page + "&limit=24";
        } else if (filters.year && filters.year !== "") {
            finalUrl = "https://ophim1.com/v1/api/nam-phat-hanh/" + filters.year + "?page=" + page + "&limit=24";
        }

        return finalUrl;
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
    return "https://ophim1.com/v1/api/phim/" + slug;
}

// Lấy danh sách Thể loại, Quốc gia, Năm trực tiếp từ máy chủ OPhim
function getUrlCategories() { return "https://ophim1.com/v1/api/the-loai"; }
function getUrlCountries() { return "https://ophim1.com/v1/api/quoc-gia"; }
function getUrlYears() { return "https://ophim1.com/v1/api/nam-phat-hanh"; }

// =============================================================================
// 3. PARSERS (BÓC TÁCH JSON SẠCH SẼ, NHANH CHÓNG)
// =============================================================================

// Hàm hỗ trợ lấy Link Ảnh cực xịn (Tự động bù tên miền nếu thiếu)
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
        var items = data.items || [];
        var pagination = data.params && data.params.pagination ? data.params.pagination : {};
        var domainImage = data.APP_DOMAIN_CDN_IMAGE || "https://img.ophim.live/uploads/movies/";

        var movies = items.map(function(item) {
            return {
                id: item.slug,
                title: item.name,
                posterUrl: getPosterUrl(item.poster_url, domainImage),
                backdropUrl: getPosterUrl(item.thumb_url, domainImage),
                year: item.year || 0,
                quality: item.quality || "HD",
                episode_current: item.episode_current || "Full",
                lang: item.lang || ""
            };
        });

        // Tính toán số trang (OPhim đôi khi trả về null nên phải tính thủ công an toàn)
        var totalPages = 1;
        if (pagination.totalItems && pagination.totalItemsPerPage) {
            totalPages = Math.ceil(pagination.totalItems / pagination.totalItemsPerPage);
        }

        return JSON.stringify({
            items: movies,
            pagination: {
                currentPage: pagination.currentPage || 1,
                totalPages: totalPages,
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
        var movie = response.data.item || {};
        var episodes = response.data.item.episodes || [];
        var domainImage = response.data.APP_DOMAIN_CDN_IMAGE || "https://img.ophim.live/uploads/movies/";

        // 1. Phân loại Danh sách Tập phim & Server
        var servers = [];
        episodes.forEach(function(server) {
            var serverEpisodes = [];
            if (server.server_data) {
                server.server_data.forEach(function(ep) {
                    serverEpisodes.push({
                        id: ep.link_m3u8 || ep.link_embed, // Nhét luôn link M3U8 vào ID để App gọi
                        name: ep.name,
                        slug: ep.slug
                    });
                });
            }
            if (serverEpisodes.length > 0) {
                servers.push({ name: server.server_name, episodes: serverEpisodes });
            }
        });

        // 2. Bóc thông tin phụ (Thể loại, Đạo diễn, Diễn viên...)
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
            description: (movie.content || "").replace(/<[^>]*>/g, ""), // Dọn sạch mã HTML
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

// Bắt link Play trực tiếp không qua trung gian
function parseDetailResponse(apiResponseJson) {
    return JSON.stringify({
        url: "", // App VAAPP sẽ tự động dùng link M3U8 ở chỗ ID Tập phim
        headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Origin": "https://ophim1.com/",
            "Referer": "https://ophim1.com/"
        },
        subtitles: []
    });
}

// Bóc tách Menu Bộ lọc từ Server
function parseCategoriesResponse(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var items = response.data.items || [];
        return JSON.stringify(items.map(function(i) { return { name: i.name, slug: i.slug, value: i.slug }; }));
    } catch (e) { return "[]"; }
}

function parseCountriesResponse(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var items = response.data.items || [];
        return JSON.stringify(items.map(function(i) { return { name: i.name, slug: i.slug, value: i.slug }; }));
    } catch (e) { return "[]"; }
}

function parseYearsResponse(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var items = response.data.items || [];
        // Nếu API có trả về danh sách năm
        if (items.length > 0) {
             return JSON.stringify(items.map(function(i) { return { name: i.name, slug: i.slug, value: i.slug }; }));
        }
    } catch (e) {}
    
    // Nếu API lỗi, tự động tạo danh sách năm từ 2000 đến hiện tại
    var years = [];
    for (var i = new Date().getFullYear(); i >= 2000; i--) {
        years.push({ name: i.toString(), slug: i.toString(), value: i.toString() });
    }
    return JSON.stringify(years);
}

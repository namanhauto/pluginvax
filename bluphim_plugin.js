// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "bluphim_me",
        "name": "BluPhim",
        "version": "1.0.1",
        "baseUrl": "https://bluphim.me",
        "iconUrl": "https://bluphim.me/favicon.ico",
        "isEnabled": true,
        "type": "MOVIE"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim-moi', title: 'Phim Mới Cập Nhật', type: 'Grid', path: 'danh-sach' },
        { slug: 'phim-bo', title: 'Phim Bộ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-le', title: 'Phim Lẻ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-chieu-rap', title: 'Phim Chiếu Rạp', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'hoat-hinh', title: 'Hoạt Hình', type: 'Horizontal', path: 'danh-sach' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Hành Động', slug: 'hanh-dong' },
        { name: 'Cổ Trang', slug: 'co-trang' },
        { name: 'Tình Cảm', slug: 'tinh-cam' },
        { name: 'Kinh Dị', slug: 'kinh-di' },
        { name: 'Hài Hước', slug: 'hai-huoc' },
        { name: 'Phiêu Lưu', slug: 'phieu-luu' },
        { name: 'Tâm Lý', slug: 'tam-ly' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [] // Web HTML thường khó filter API nên tạm để trống
    });
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        return "https://bluphim.me/" + slug + "?page=" + page;
    } catch (e) {
        return "https://bluphim.me/" + slug;
    }
}

function getUrlSearch(keyword, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        if (page > 1) {
            return "https://bluphim.me/page/" + page + "/?s=" + encodeURIComponent(keyword);
        }
        return "https://bluphim.me/?s=" + encodeURIComponent(keyword);
    } catch (e) {
        return "https://bluphim.me/?s=" + encodeURIComponent(keyword);
    }
}

function getUrlDetail(slug) {
    // Chống lỗi đường dẫn
    if (slug.indexOf('http') === 0) return slug;
    slug = slug.replace(/^\/+|\/+$/g, ''); 
    return "https://bluphim.me/" + slug + "/"; 
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(html) {
    try {
        var items = []; 
        var blocks = html.split('class="movie-card-2"');
        blocks.shift(); 

        for (var i = 0; i < blocks.length; i++) {
            var block = blocks[i];
            var linkMatch = block.match(/<a href="([^"]+)"/);
            var url = linkMatch ? linkMatch[1] : "";
            
            // Xử lý ID siêu gọn để App mượt hơn
            var slugMatch = url.match(/bluphim\.me\/(.+)$/);
            var id = slugMatch ? slugMatch[1].replace(/\/$/, '') : url;

            var titleMatch = block.match(/<h3 class="movie-title">[\s\S]*?<a[^>]+>([^<]+)<\/a>/);
            var title = titleMatch ? titleMatch[1].trim() : "N/A";

            var posterMatch = block.match(/src="([^"]+)"/);
            var posterUrl = posterMatch ? posterMatch[1] : "";

            var epiMatch = block.match(/episode-badge">([\s\S]*?)<\/span>/);
            var episode_current = "";
            if (epiMatch) {
                episode_current = epiMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
            }

            if (id && title !== "N/A") {
                items.push({
                    id: id,
                    title: title,
                    posterUrl: posterUrl,
                    backdropUrl: posterUrl,
                    year: 0,
                    quality: "HD",
                    episode_current: episode_current,
                    lang: ""
                });
            }
        }

        return JSON.stringify({
            items: items,
            pagination: {
                currentPage: 1,
                totalPages: 50,
                totalItems: 1000,
                itemsPerPage: 20
            }
        });
    } catch (error) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(html) {
    try {
        var titleMatch = html.match(/<h1 class="movie-title-detail">([\s\S]*?)<\/h1>/);
        var title = titleMatch ? titleMatch[1].trim() : "N/A";

        var posterMatch = html.match(/class="movie-box-img"[\s\S]*?src="([^"]+)"/);
        var posterUrl = posterMatch ? posterMatch[1] : "";

        var descMatch = html.match(/content-detail">([\s\S]*?)<div class="hidden">/);
        var description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() : "";
        
        var catMatch = html.match(/Thể loại:[\s\S]*?<td>([\s\S]*?)<\/td>/);
        var category = catMatch ? catMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : "";

        var castMatch = html.match(/Diễn viên:[\s\S]*?<td>([\s\S]*?)<\/td>/);
        var casts = castMatch ? castMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : "";

        var servers = [];
        var serverBlocks = html.split('class="title_server"');
        serverBlocks.shift(); 

        for (var i = 0; i < serverBlocks.length; i++) {
            var block = serverBlocks[i];
            var nameMatch = block.match(/<h3>([\s\S]*?)<\/h3>/);
            var serverName = nameMatch ? nameMatch[1].trim() : "Server " + (i+1);

            var episodes = [];
            var epRegex = /<a href="([^"]+)"[^>]*>[\s\S]*?<div class="episode-number">([\s\S]*?)<\/div>/g;
            var epMatch;
            
            while ((epMatch = epRegex.exec(block)) !== null) {
                var fullUrl = epMatch[1];
                var slugMatch = fullUrl.match(/bluphim\.me\/(.+)$/);
                var slug = slugMatch ? slugMatch[1].replace(/\/$/, '') : fullUrl;

                episodes.push({
                    id: slug, // Bắt buộc ID phải là slug để Play Video mượt
                    name: "Tập " + epMatch[2].trim(),
                    slug: slug 
                });
            }

            if (episodes.length > 0) {
                servers.push({ name: serverName, episodes: episodes });
            }
        }

        return JSON.stringify({
            id: title, // App dùng ID này để nhận diện phim
            title: title,
            posterUrl: posterUrl,
            backdropUrl: posterUrl,
            description: description,
            category: category,
            casts: casts,
            servers: servers 
        });
    } catch (error) { 
        return "null"; 
    }
}

function parseDetailResponse(html) {
    try {
        var url = "";
        
        // Bắt link stream (M3U8) từ HTML của trang Tập Phim
        var match = html.match(/all_sources\s*=\s*\[\s*["']([^"']+)["']/i);
        if (match && match[1]) { 
            url = match[1]; 
        } else {
            var iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
            if (iframeMatch) {
                url = iframeMatch[1];
            }
        }

        return JSON.stringify({
            url: url,
            headers: { 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://bluphim.me/", 
                "Origin": "https://bluphim.me/" 
            },
            subtitles: []
        });
    } catch (error) { 
        return JSON.stringify({ url: "", headers: {}, subtitles: [] }); 
    }
}

function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(apiResponseJson) { return "[]"; }
function parseYearsResponse(apiResponseJson) { return "[]"; }

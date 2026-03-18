// =============================================================================
// 1. CONFIGURATION & METADATA
// =============================================================================
function getManifest() {
    return JSON.stringify({
        "id": "bluphim_me",       
        "name": "BluPhim",           
        "version": "1.0.9",          
        "baseUrl": "https://bluphim.me",
        "iconUrl": "https://bluphim.me/favicon.ico", 
        "isEnabled": true,         
        "type": "MOVIE",
        "layoutType": "VERTICAL"
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
        { name: 'Tình Cảm', slug: 'tinh-cam' },
        { name: 'Cổ Trang', slug: 'co-trang' },
        { name: 'Kinh Dị', slug: 'kinh-di' },
        { name: 'Hài Hước', slug: 'hai-huoc' },
        { name: 'Hình Sự', slug: 'hinh-su' },
        { name: 'Phiêu Lưu', slug: 'phieu-luu' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Thời gian cập nhật', value: 'modified.time' },
            { name: 'Năm phát hành', value: 'year' }
        ]
    });
}

// =============================================================================
// 2. URL GENERATION
// =============================================================================
function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        var finalSlug = slug;

        if (filters.category && filters.category !== "") {
            finalSlug = filters.category;
        } else if (filters.country && filters.country !== "") {
            finalSlug = "country/" + filters.country;
        }

        return "https://bluphim.me/" + finalSlug + "?page=" + page;
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
    if (slug.indexOf('http') === 0) return slug;
    slug = slug.replace(/\/+$/, ''); 
    return "https://bluphim.me/" + slug + "/"; 
}

// ---> CUNG CẤP LINK MỒI ĐỂ APP KÍCH HOẠT NÚT BỘ LỌC <---
function getUrlCategories() { return "https://bluphim.me/"; }
function getUrlCountries() { return "https://bluphim.me/"; }
function getUrlYears() { return "https://bluphim.me/"; }

// =============================================================================
// 3. PARSERS (BÓC TÁCH DỮ LIỆU)
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
            
            var id = url;
            if (url.indexOf('bluphim.me/') > -1) {
                id = url.split('bluphim.me/')[1].replace(/\/+$/, '');
            }

            var titleMatch = block.match(/<h3 class="movie-title">[\s\S]*?<a[^>]+>([^<]+)<\/a>/);
            var title = titleMatch ? titleMatch[1].trim() : "N/A";

            var posterMatch = block.match(/src="([^"]+)"/);
            var posterUrl = posterMatch ? posterMatch[1] : "";

            var epiMatch = block.match(/episode-badge">([\s\S]*?)<\/span>/);
            var episode_current = "";
            if (epiMatch) {
                episode_current = epiMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
            }

            var qualityMatch = block.match(/quality-badge">([^<]+)<\/span>/i);
            var quality = qualityMatch ? qualityMatch[1].trim() : "HD";

            if (id && title !== "N/A") {
                items.push({
                    id: id,
                    title: title,
                    posterUrl: posterUrl,
                    backdropUrl: posterUrl,
                    year: 0,
                    quality: quality,
                    episode_current: episode_current,
                    lang: ""
                });
            }
        }

        return JSON.stringify({
            items: items,
            pagination: { currentPage: 1, totalPages: 50, totalItems: 1000, itemsPerPage: 20 }
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
        var id = "unknown";
        var urlMatch = html.match(/<meta property="og:url" content="([^"]+)"/i) || html.match(/<link rel="canonical" href="([^"]+)"/i);
        
        if (urlMatch && urlMatch[1]) {
            if (urlMatch[1].indexOf('bluphim.me/') > -1) {
                id = urlMatch[1].split('bluphim.me/')[1].replace(/\/+$/, '');
            }
        }

        var titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
        var title = titleMatch ? titleMatch[1].replace("Xem phim", "").replace("vietsub", "").trim() : "N/A";

        var posterMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
        var posterUrl = posterMatch ? posterMatch[1] : "";

        var descMatch = html.match(/<meta property="og:description" content="([^"]+)"/i);
        var description = descMatch ? descMatch[1].trim() : "Đang cập nhật nội dung...";
        
        var catMatch = html.match(/Thể loại:[\s\S]*?<td>([\s\S]*?)<\/td>/);
        var category = catMatch ? catMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : "";

        var castMatch = html.match(/Diễn viên:[\s\S]*?<td>([\s\S]*?)<\/td>/);
        var casts = castMatch ? castMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : "";

        var yearMatch = html.match(/>(20\d{2})<\/a>/);
        var year = yearMatch ? parseInt(yearMatch[1]) : 0;

        var qualityMatch = html.match(/class="icon-play"><\/i>\s*<span>([^<]+)<\/span>/i);
        var quality = qualityMatch ? qualityMatch[1].trim() : "HD";

        var servers = [];
        var serverBlocks = html.split('class="title_server"');
        
        if (serverBlocks.length > 1) {
            serverBlocks.shift(); 
            for (var i = 0; i < serverBlocks.length; i++) {
                var block = serverBlocks[i];
                var nameMatch = block.match(/>\s*<h3>([^<]+)<\/h3>/);
                var serverName = nameMatch ? nameMatch[1].trim() : "Server " + (i+1);

                var episodes = [];
                var epRegex = /<a href="([^"]+)"[^>]*>[\s\S]*?<div class="episode-number">([^<]+)<\/div>/g;
                var epMatch;
                
                while ((epMatch = epRegex.exec(block)) !== null) {
                    var fullUrl = epMatch[1];
                    var epSlug = fullUrl;
                    if (fullUrl.indexOf('bluphim.me/') > -1) {
                        epSlug = fullUrl.split('bluphim.me/')[1].replace(/\/+$/, '');
                    }

                    episodes.push({
                        id: epSlug, 
                        name: "Tập " + epMatch[2].trim(),
                        slug: epSlug 
                    });
                }

                if (episodes.length > 0) {
                    servers.push({ name: serverName, episodes: episodes });
                }
            }
        } else {
            var watchMatch = html.match(/<a href="([^"]+)" class="btn-watch-movie">/i);
            if (watchMatch) {
                var singleUrl = watchMatch[1];
                var singleSlug = singleUrl;
                if (singleUrl.indexOf('bluphim.me/') > -1) {
                    singleSlug = singleUrl.split('bluphim.me/')[1].replace(/\/+$/, '');
                }
                
                servers.push({
                    name: "Vietsub",
                    episodes: [{ id: singleSlug, name: "Full", slug: singleSlug }]
                });
            }
        }

        return JSON.stringify({
            id: id, 
            title: title,
            posterUrl: posterUrl,
            backdropUrl: posterUrl,
            description: description,
            category: category,
            casts: casts,
            year: year,
            quality: quality,
            servers: servers 
        });
    } catch (error) { 
        return JSON.stringify({ servers: [] }); 
    }
}

function parseDetailResponse(html) {
    try {
        var url = "";
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

// ---> CÁC HÀM NÀY ĐÃ ĐƯỢC NHỒI DỮ LIỆU CHUẨN XÁC <---
function parseCategoriesResponse(html) {
    return JSON.stringify([
        { name: 'Bí Ẩn', slug: 'bi-an', value: 'bi-an' },
        { name: 'Chính Kịch', slug: 'chinh-kich', value: 'chinh-kich' },
        { name: 'Cổ Trang', slug: 'co-trang', value: 'co-trang' },
        { name: 'Gia Đình', slug: 'gia-dinh', value: 'gia-dinh' },
        { name: 'Hài Hước', slug: 'hai-huoc', value: 'hai-huoc' },
        { name: 'Hành Động', slug: 'hanh-dong', value: 'hanh-dong' },
        { name: 'Hình Sự', slug: 'hinh-su', value: 'hinh-su' },
        { name: 'Khoa Học', slug: 'khoa-hoc', value: 'khoa-hoc' },
        { name: 'Kinh Dị', slug: 'kinh-di', value: 'kinh-di' },
        { name: 'Phiêu Lưu', slug: 'phieu-luu', value: 'phieu-luu' },
        { name: 'Tâm Lý', slug: 'tam-ly', value: 'tam-ly' },
        { name: 'Tình Cảm', slug: 'tinh-cam', value: 'tinh-cam' },
        { name: 'Viễn Tưởng', slug: 'vien-tuong', value: 'vien-tuong' }
    ]);
}

function parseCountriesResponse(html) {
    return JSON.stringify([
        { name: 'Âu Mỹ', slug: 'au-my', value: 'au-my' },
        { name: 'Hàn Quốc', slug: 'han-quoc', value: 'han-quoc' },
        { name: 'Trung Quốc', slug: 'trung-quoc', value: 'trung-quoc' },
        { name: 'Nhật Bản', slug: 'nhat-ban', value: 'nhat-ban' },
        { name: 'Thái Lan', slug: 'thai-lan', value: 'thai-lan' },
        { name: 'Việt Nam', slug: 'viet-nam', value: 'viet-nam' }
    ]);
}

function parseYearsResponse(html) {
    var years = [];
    for (var i = 2026; i >= 2000; i--) {
        years.push({ name: i.toString(), slug: i.toString(), value: i.toString() });
    }
    return JSON.stringify(years);
}

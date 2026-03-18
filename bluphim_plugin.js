// =============================================================================
// 1. CONFIGURATION & METADATA
// =============================================================================
function getManifest() {
    return JSON.stringify({
        "id": "bluphim_me",       
        "name": "BluPhim",           
        "version": "1.0.5",          
        "baseUrl": "https://bluphim.me",
        "iconUrl": "https://bluphim.me/favicon.ico", 
        "isEnabled": true,
        "isAdult": false,            
        "type": "MOVIE",
        "layoutType": "VERTICAL"
    });
}

function getHomeSections() {
    return JSON.stringify([
        // Đưa Phim Mới lên đầu với kiểu Banner (Tùy App hỗ trợ hiện ảnh to trượt ngang)
        { slug: 'phim-moi', title: '🔥 Phim Mới Cập Nhật', type: 'Banner', path: 'danh-sach' },
        { slug: 'phim-bo', title: 'Phim Bộ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-le', title: 'Phim Lẻ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-chieu-rap', title: 'Phim Chiếu Rạp', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'hoat-hinh', title: 'Hoạt Hình', type: 'Horizontal', path: 'danh-sach' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Hành Động', slug: 'hanh-dong' },
        { name: 'Miền Tây', slug: 'mien-tay' },
        { name: 'Trẻ Em', slug: 'tre-em' },
        { name: 'Lịch Sử', slug: 'lich-su' },
        { name: 'Cổ Trang', slug: 'co-trang' },
        { name: 'Kinh Dị', slug: 'kinh-di' },
        { name: 'Phim 18+', slug: 'phim-18' },
        { name: 'Tâm Lý', slug: 'tam-ly' }
    ]);
}

// ---> NÂNG CẤP BỘ LỌC ĐỂ HIỆN MENU NHƯ IMAGE_11.PNG <---
function getFilterConfig() {
    var primaryCategories = [
        { name: 'Tất cả Thể loại', slug: '' }, // Tùy chọn mặc định
        { name: 'Hành Động', slug: 'hanh-dong' },
        { name: 'Miền Tây', slug: 'mien-tay' },
        { name: 'Trẻ Em', slug: 'tre-em' },
        { name: 'Lịch Sử', slug: 'lich-su' },
        { name: 'Cổ Trang', slug: 'co-trang' },
        { name: 'Kinh Dị', slug: 'kinh-di' },
        { name: 'Phim 18+', slug: 'phim-18' },
        { name: 'Tâm Lý', slug: 'tam-ly' }
    ];

    return JSON.stringify({
        // Tạm thời Hardcode sort để menu hiện ra, Web HTML khó sort động
        sort: [
            { name: 'Thời gian cập nhật', value: 'modified.time' },
            { name: 'Năm phát hành', value: 'year' },
            { name: 'Theo ID', value: '_id' }
        ],
        categories: primaryCategories // Hiển thị danh mục khớp Primary Categories
    });
}

// =============================================================================
// 2. URL GENERATION (TẠO LINK TRUY CẬP)
// =============================================================================
// ---> NÂNG CẤP HÀM NÀY ĐỂ XỬ LÝ DỮ LIỆU TỪ BỘ LỌC <---
function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        
        // Slug mặc định là slug từ Home Section (ví dụ: phim-moi, phim-bo)
        var finalSlug = slug;
        
        // Nếu người dùng chọn thể loại trong Bộ Lọc, ta ưu tiên dùng nó
        if (filters.category && filters.category !== "") {
            finalSlug = filters.category;
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
    // Cắt dấu gạch chéo dư thừa ở cuối một cách an toàn
    slug = slug.replace(/\/+$/, ''); 
    return "https://bluphim.me/" + slug + "/"; 
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// 3. PARSERS (BÓC TÁCH DỮ LIỆU HTML)
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
            
            // Tách ID an toàn không dùng Regex phức tạp
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

// ---> NÂNG CẤP DỮ LIỆU ĐỂ CLEAN NOIDUNG PHIM NHƯ IMAGE_10.PNG <---
function parseMovieDetail(html) {
    try {
        var id = "unknown";
        var urlMatch = html.match(/<meta property="og:url" content="([^"]+)"/i) || html.match(/<link rel="canonical" href="([^"]+)"/i);
        
        if (urlMatch && urlMatch[1]) {
            if (urlMatch[1].indexOf('bluphim.me/') > -1) {
                id = urlMatch[1].split('bluphim.me/')[1].replace(/\/+$/, '');
            }
        }

        var titleMatch = html.match(/<h1 class="movie-title-detail">([^<]+)<\/h1>/);
        var title = titleMatch ? titleMatch[1].trim() : "N/A";

        var posterMatch = html.match(/class="movie-box-img"[\s\S]*?src="([^"]+)"/);
        var posterUrl = posterMatch ? posterMatch[1] : "";

        // BÓC mô tả và clean tag rác
        var descMatch = html.match(/content-detail">([\s\S]*?)<div class="hidden">/);
        var description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() : "";
        
        // Clean Description nếu có những đoạn text kỳ lạ như #text
        description = description.split('\n').map(function(line) { return line.trim(); }).filter(function(line) { return line !== "#text"; }).join("\n");

        var catMatch = html.match(/Thể loại:[\s\S]*?<td>([\s\S]*?)<\/td>/);
        var category = catMatch ? catMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : "";

        var castMatch = html.match(/Diễn viên:[\s\S]*?<td>([\s\S]*?)<\/td>/);
        var casts = castMatch ? castMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : "";

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

function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(apiResponseJson) { return "[]"; }
function parseYearsResponse(apiResponseJson) { return "[]"; }

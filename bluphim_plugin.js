// =============================================================================
// 1. CONFIGURATION & METADATA
// =============================================================================
function getManifest() {
    return JSON.stringify({
        "id": "bluphim_me",       
        "name": "BluPhim",           
        "version": "1.0.6",          
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
        // Đổi type thành 'Banner' hy vọng App VAAPP sẽ kích hoạt banner to
        { slug: 'phim-moi', title: '🔥 Phim Mới Cập Nhật', type: 'Banner', path: 'danh-sach' },
        { slug: 'phim-bo', title: 'Phim Bộ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-le', title: 'Phim Lẻ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-chieu-rap', title: 'Phim Chiếu Rạp', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'hoat-hinh', title: 'Hoạt Hình', type: 'Horizontal', path: 'danh-sach' }
    ]);
}

// KHAI BÁO BỘ LỌC ĐẦY ĐỦ HƠN (THÊM QUỐC GIA)
function getFilterConfig() {
    return JSON.stringify({
        categories: [
            { name: 'Hành Động', slug: 'hanh-dong' },
            { name: 'Miền Tây', slug: 'mien-tay' },
            { name: 'Trẻ Em', slug: 'tre-em' },
            { name: 'Lịch Sử', slug: 'lich-su' },
            { name: 'Cổ Trang', slug: 'co-trang' },
            { name: 'Kinh Dị', slug: 'kinh-di' },
            { name: 'Tâm Lý', slug: 'tam-ly' }
        ],
        countries: [
            { name: 'Âu Mỹ', slug: 'au-my' },
            { name: 'Hàn Quốc', slug: 'han-quoc' },
            { name: 'Trung Quốc', slug: 'trung-quoc' }
        ]
    });
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Hành Động', slug: 'hanh-dong' },
        { name: 'Miền Tây', slug: 'mien-tay' },
        { name: 'Cổ Trang', slug: 'co-trang' },
        { name: 'Kinh Dị', slug: 'kinh-di' }
    ]);
}

// =============================================================================
// 2. URL GENERATION (XỬ LÝ LINK TỪ BỘ LỌC)
// =============================================================================
function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        var finalSlug = slug;

        // Nếu người dùng chọn bộ lọc, thay đổi link tương ứng
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

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

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
                    backdropUrl: posterUrl, // Banner to sẽ lấy ảnh này
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
        var urlMatch = html.match(/<meta property="og:url" content="([^"]+)"/i);
        if (urlMatch && urlMatch[1]) {
            if (urlMatch[1].indexOf('bluphim.me/') > -1) {
                id = urlMatch[1].split('bluphim.me/')[1].replace(/\/+$/, '');
            }
        }

        // MOI TÊN PHIM VÀ NỘI DUNG TỪ THẺ META (100% CHÍNH XÁC VÀ SẠCH)
        var titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
        var title = titleMatch ? titleMatch[1].replace("Xem phim", "").replace("vietsub", "").trim() : "N/A";

        var posterMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
        var posterUrl = posterMatch ? posterMatch[1] : "";

        // Đây là "Chén thánh" để hiện nội dung phim
        var descMatch = html.match(/<meta property="og:description" content="([^"]+)"/i);
        var description = descMatch ? descMatch[1].trim() : "Đang cập nhật nội dung...";
        
        var catMatch = html.match(/Thể loại:[\s\S]*?<td>([\s\S]*?)<\/td>/);
        var category = catMatch ? catMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : "";

        var castMatch = html.match(/Diễn viên:[\s\S]*?<td>([\s\S]*?)<\/td>/);
        var casts = castMatch ? castMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : "";

        // TÌM NĂM PHÁT HÀNH
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

function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(apiResponseJson) { return "[]"; }
function parseYearsResponse(apiResponseJson) { return "[]"; }

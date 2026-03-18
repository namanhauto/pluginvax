// ==========================================
// 1. KHAI BÁO THÔNG TIN (MANIFEST)
// ==========================================
function getManifest() {
    return JSON.stringify({
        "id": "bluphim_me_v1",       
        "name": "BluPhim",           
        "version": "1.0.0",          
        "baseUrl": "https://bluphim.me",
        "iconUrl": "https://bluphim.me/favicon.ico", 
        "isEnabled": true,
        "isAdult": false,            
        "type": "MOVIE",
        "layoutType": "VERTICAL"
    });
}

// ==========================================
// 2. CẤU HÌNH GIAO DIỆN (TRANG CHỦ & DANH MỤC)
// ==========================================
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

// ==========================================
// 3. CUNG CẤP CÁC ĐƯỜNG LINK (ROUTING)
// ==========================================
function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        var url = "https://bluphim.me/" + slug;
        
        // Chuẩn phân trang của WordPress
        if (page > 1) {
            url = url + "/page/" + page + "/"; 
        }
        return url;
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
    return "https://bluphim.me/" + slug + "/"; 
}

// ==========================================
// 4. BÓC TÁCH DANH SÁCH PHIM
// ==========================================
function parseListResponse(html) {
    try {
        var items = []; 
        var blocks = html.split('class="movie-card-2"');
        blocks.shift(); 

        for (var i = 0; i < blocks.length; i++) {
            var block = blocks[i];
            var linkMatch = block.match(/<a href="([^"]+)"/);
            var url = linkMatch ? linkMatch[1] : "";
            var idMatch = url.match(/\/([^\/]+)\/?$/);
            var id = idMatch ? idMatch[1] : url;

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
                    "id": id,
                    "title": title,
                    "posterUrl": posterUrl,
                    "year": 0,
                    "quality": "HD",
                    "episode_current": episode_current
                });
            }
        }

        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": 1, "totalPages": 50, "totalItems": 1000, "itemsPerPage": 20 }
        });
    } catch (e) {
        return JSON.stringify({"items": [], "pagination": {}});
    }
}

// ==========================================
// 5. BÓC TÁCH CHI TIẾT & TẬP PHIM
// ==========================================
function parseMovieDetail(html) {
    try {
        var titleMatch = html.match(/<h1 class="movie-title-detail">([\s\S]*?)<\/h1>/);
        var title = titleMatch ? titleMatch[1].trim() : "N/A";

        var posterMatch = html.match(/class="movie-box-img"[\s\S]*?src="([^"]+)"/);
        var posterUrl = posterMatch ? posterMatch[1] : "";

        var descMatch = html.match(/content-detail">([\s\S]*?)<div class="hidden">/);
        var description = "";
        if (descMatch) {
            description = descMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
        }

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
                episodes.push({
                    "id": epMatch[1], 
                    "name": "Tập " + epMatch[2].trim(),
                    "slug": epMatch[1] 
                });
            }

            if (episodes.length > 0) {
                servers.push({ "name": serverName, "episodes": episodes });
            }
        }

        return JSON.stringify({
            "id": title, 
            "title": title,
            "posterUrl": posterUrl,
            "description": description,
            "servers": servers 
        });
    } catch (e) {
        return JSON.stringify({"servers": []});
    }
}

// ==========================================
// 6. BẮT LINK VIDEO PLAY
// ==========================================
function parseDetailResponse(html) {
    try {
        var url = "";
        var match = html.match(/var\s+all_sources\s*=\s*\[\s*"([^"]+)"/);
        if (match) { url = match[1]; }

        return JSON.stringify({
            "url": url,
            "headers": { "Referer": "https://bluphim.me/", "Origin": "https://bluphim.me/" },
            "subtitles": []
        });
    } catch (e) {
        return JSON.stringify({"url": ""});
    }
}

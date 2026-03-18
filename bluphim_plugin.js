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

function getUrlList(slug, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    return "https://bluphim.me/" + slug + "?page=" + page;
}

function getUrlSearch(keyword, page) {
    return "https://bluphim.me/tim-kiem?q=" + encodeURIComponent(keyword) + "&page=" + page;
}

function getUrlDetail(slug) {
    return "https://bluphim.me/" + slug + "/"; 
}

function parseListResponse(html) {
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
}

function parseMovieDetail(html) {
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
}

function parseDetailResponse(html) {
    var url = "";
    
    // Nâng cấp Regex: Bắt chính xác mảng all_sources
    var match = html.match(/all_sources\s*=\s*\[\s*["']([^"']+)["']/i);
    if (match && match[1]) { 
        url = match[1]; 
    } else {
        // Fallback: Tìm link iframe dự phòng nếu web giấu m3u8
        var iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
        if (iframeMatch) {
            url = iframeMatch[1];
        }
    }

    return JSON.stringify({
        "url": url,
        "headers": { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://bluphim.me/", 
            "Origin": "https://bluphim.me/" 
        },
        "subtitles": []
    });
}

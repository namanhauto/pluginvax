// =============================================================================
// 1. CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "bluphim_me",
        "name": "BluPhim",
        "version": "1.0.3",
        "baseUrl": "https://bluphim.me",
        "iconUrl": "https://bluphim.me/favicon.ico",
        "isEnabled": true,
        "type": "MOVIE"
    });
}

function getHomeSections() {
    return JSON.stringify([
        // Đưa Phim Mới lên đầu với kiểu Banner/Grid tùy app hỗ trợ
        { slug: 'phim-moi', title: '🔥 Phim Mới Cập Nhật', type: 'Grid', path: 'danh-sach' },
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
    return JSON.stringify({ sort: [] });
}

// =============================================================================
// 2. URL GENERATION (TẠO LINK TRUY CẬP)
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
    if (slug.indexOf('http') === 0) return slug;
    slug = slug.replace(/^\/+|\/+$/g, ''); 
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
            
            // Bắt link & ID
            var linkMatch = block.match(/<a href="([^"]+)"/);
            var url = linkMatch ? linkMatch[1] : "";
            var slugMatch = url.match(/bluphim\.me\/(.+)$/);
            var id = slugMatch ? slugMatch[1].replace(/\/$/, '') : url;

            // Bắt Tên Phim
            var titleMatch = block.match(/<h3 class="movie-title">[\s\S]*?<a[^>]+>([^<]+)<\/a>/);
            var title = titleMatch ? titleMatch[1].trim() : "N/A";

            // Bắt Ảnh
            var posterMatch = block.match(/src="([^"]+)"/);
            var posterUrl = posterMatch ? posterMatch[1] : "";

            // Bắt Số Tập (Tập 24/24)
            var epiMatch = block.match(/episode-badge">([\s\S]*?)<\/span>/);
            var episode_current = "";
            if (epiMatch) {
                episode_current = epiMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
            }

            // Bắt Chất Lượng (HD/FHD)
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
        // TÌM ID
        var id = "unknown";
        var urlMatch = html.match(/<meta property="og:url" content="([^"]+)"/i) || html.match(/<link rel="canonical" href="([^"]+)"/i);
        if (urlMatch && urlMatch[1]) {
            var slugMatch = urlMatch[1].match(/bluphim\.me\/(.+)$/);
            if (slugMatch) id = slugMatch[1].replace(/\/$/, '');
        }

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

        var qualityMatch = html.match(/class="icon-play"><\/i>\s*<span>([^<]+)<\/span>/i);
        var quality = qualityMatch ? qualityMatch[1].trim() : "HD";

        var servers = [];
        var serverBlocks = html.split('class="title_server"');
        
        // KIỂM TRA LÀ PHIM BỘ HAY PHIM LẺ
        if (serverBlocks.length > 1) {
            serverBlocks.shift(); 
            for (var i = 0; i < serverBlocks.length; i++) {
                var block = serverBlocks[i];
                var nameMatch = block.match(/>

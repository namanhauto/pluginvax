// =============================================================================
// 1. CONFIGURATION & METADATA (YANHH3D V1.0.2)
// =============================================================================
function getManifest() {
    return JSON.stringify({
        "id": "yanhh3d_web",       
        "name": "YanHH3D",           
        "version": "1.0.2",          
        "baseUrl": "https://yanhh3d.sh",
        "iconUrl": "https://raw.githubusercontent.com/namanhauto/pluginvax/main/Plugins/Yahh3d_logo.png", 
        "isEnabled": true,       
        "type": "MOVIE",
        "layoutType": "VERTICAL"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'trending', title: '🔥 Đề Cử / Xem Nhiều', type: 'Banner', path: 'danh-sach' },
        { slug: 'moi-cap-nhat', title: 'Mới Cập Nhật', type: 'Grid', path: 'danh-sach' },
        { slug: 'hoat-hinh-3d', title: 'Hoạt Hình 3D', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'hoat-hinh-2d', title: 'Hoạt Hình 2D', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'hoan-thanh', title: 'Đã Hoàn Thành', type: 'Horizontal', path: 'danh-sach' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Huyền Huyễn', slug: 'huyen-huyen' },
        { name: 'Xuyên Không', slug: 'xuyen-khong' },
        { name: 'Trùng Sinh', slug: 'trung-sinh' },
        { name: 'Tiên Hiệp', slug: 'tien-hiep' },
        { name: 'Cổ Trang', slug: 'co-trang' },
        { name: 'Kiếm Hiệp', slug: 'kiem-hiep' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [], 
        categories: [
            { name: 'Huyền Huyễn', slug: 'huyen-huyen', value: 'huyen-huyen' },
            { name: 'Xuyên Không', slug: 'xuyen-khong', value: 'xuyen-khong' },
            { name: 'Trùng Sinh', slug: 'trung-sinh', value: 'trung-sinh' },
            { name: 'Tiên Hiệp', slug: 'tien-hiep', value: 'tien-hiep' },
            { name: 'Cổ Trang', slug: 'co-trang', value: 'co-trang' },
            { name: 'Kiếm Hiệp', slug: 'kiem-hiep', value: 'kiem-hiep' },
            { name: 'Hài Hước', slug: 'hai-huoc', value: 'hai-huoc' },
            { name: 'Hiện Đại', slug: 'hien-dai', value: 'hien-dai' }
        ]
    });
}

// =============================================================================
// 2. URL GENERATION (TẠO ĐƯỜNG DẪN)
// =============================================================================
function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        var finalSlug = slug;

        if (filters.category && filters.category !== "") {
            finalSlug = "the-loai/" + filters.category;
        }

        if (finalSlug === 'trending' || finalSlug === '') {
            return "https://yanhh3d.sh/";
        }

        return "https://yanhh3d.sh/" + finalSlug + "?page=" + page;
    } catch (e) {
        return "https://yanhh3d.sh/" + slug;
    }
}

function getUrlSearch(keyword, filtersJson) {
    var page = JSON.parse(filtersJson || "{}").page || 1;
    return "https://yanhh3d.sh/search?keysearch=" + encodeURIComponent(keyword) + "&page=" + page;
}

function getUrlDetail(slug) {
    if (slug.indexOf('http') === 0) return slug;
    return "https://yanhh3d.sh/" + slug.replace(/^\/+/, ''); 
}

function getUrlCategories() { return "https://yanhh3d.sh/"; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// 3. PARSERS: CÀO DANH SÁCH TỪ TRANG CHỦ
// =============================================================================
function parseListResponse(html) {
    try {
        var items = []; 
        var blocks = html.split('class="flw-item"'); 
        blocks.shift(); 

        for (var i = 0; i < blocks.length; i++) {
            var block = blocks[i];
            
            var linkMatch = block.match(/href="([^"]+)"/i);
            var url = linkMatch ? linkMatch[1] : "";
            var id = url;
            if (url.indexOf('yanhh3d.sh/') > -1) {
                id = url.split('yanhh3d.sh/')[1].replace(/\/+$/, '');
            }

            var titleMatch = block.match(/title="([^"]+)"/i);
            var title = titleMatch ? titleMatch[1].trim() : "N/A";

            var posterMatch = block.match(/data-src="([^"]+)"/i);
            var posterUrl = posterMatch ? posterMatch[1] : "";

            var epiMatch = block.match(/tick-rate">([^<]+)<\/div>/i);
            var episode_current = epiMatch ? epiMatch[1].trim() : "";

            var qualityMatch = block.match(/tick-dub">([^<]+)<\/div>/i);
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

function parseSearchResponse(html) { return parseListResponse(html); }

function parseCategoriesResponse(html) {
    return JSON.stringify([
        { name: 'Huyền Huyễn', slug: 'huyen-huyen', value: 'huyen-huyen' },
        { name: 'Xuyên Không', slug: 'xuyen-khong', value: 'xuyen-khong' },
        { name: 'Trùng Sinh', slug: 'trung-sinh', value: 'trung-sinh' },
        { name: 'Tiên Hiệp', slug: 'tien-hiep', value: 'tien-hiep' },
        { name: 'Cổ Trang', slug: 'co-trang', value: 'co-trang' },
        { name: 'Kiếm Hiệp', slug: 'kiem-hiep', value: 'kiem-hiep' },
        { name: 'Hài Hước', slug: 'hai-huoc', value: 'hai-huoc' },
        { name: 'Hiện Đại', slug: 'hien-dai', value: 'hien-dai' }
    ]);
}
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

// =============================================================================
// 4. PARSER: CÀO CHI TIẾT & DANH SÁCH TẬP (ĐÃ ĐƯỢC BỌC THÉP)
// =============================================================================
function parseMovieDetail(html) {
    try {
        var id = "unknown";
        var urlMatch = html.match(/<meta property="og:url" content="([^"]+)"/i);
        if (urlMatch && urlMatch[1]) {
            if (urlMatch[1].indexOf('yanhh3d.sh/') > -1) {
                id = urlMatch[1].split('yanhh3d.sh/')[1].replace(/\/+$/, '');
            }
        }

        var titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
        var title = titleMatch ? titleMatch[1].replace("Thuyết Minh", "").replace("Vietsub", "").trim() : "N/A";

        var posterMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
        var posterUrl = posterMatch ? posterMatch[1] : "";

        var descMatch = html.match(/<meta property="og:description" content="([^"]+)"/i) || html.match(/class="film-description m-hide">[\s\S]*?<div class="text">([\s\S]*?)<\/div>/i);
        var description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() : "Đang cập nhật nội dung...";

        var yearMatch = html.match(/Năm:[\s\S]*?<span class="name">(\d{4})<\/span>/i);
        var year = yearMatch ? parseInt(yearMatch[1]) : 0;

        var qualityMatch = html.match(/Thời lượng:[\s\S]*?<span class="name">([^<]+)\[4K\]<\/span>/i);
        var quality = qualityMatch ? "4K" : "HD";

        var servers = [];

        // HÀM BẮT TẬP SIÊU CẤP: Quét mọi thẻ <a> có chứa class ep-item
        function extractEpisodes(blockHtml) {
            var eps = [];
            var aTagRegex = /<a\s+([^>]+)>/ig;
            var match;
            while ((match = aTagRegex.exec(blockHtml)) !== null) {
                var attrs = match[1];
                // Chỉ nhặt những thẻ a có class là ep-item
                if (attrs.indexOf('ep-item') > -1) {
                    var hrefMatch = attrs.match(/href="([^"]+)"/i);
                    var titleMatch = attrs.match(/title="([^"]+)"/i);
                    if (hrefMatch) {
                        var epUrl = hrefMatch[1];
                        var epSlug = epUrl.indexOf('yanhh3d.sh/') > -1 ? epUrl.split('yanhh3d.sh/')[1].replace(/\/+$/, '') : epUrl;
                        epSlug = epSlug.replace(/^\/+/, '');
                        
                        var epName = titleMatch ? titleMatch[1].trim() : "Full";
                        if (epName.toLowerCase().indexOf('tập') === -1 && !isNaN(epName.charAt(0))) {
                            epName = "Tập " + epName; // Tự động thêm chữ Tập nếu chỉ có số
                        }
                        
                        // Chống lặp tập
                        var exists = false;
                        for (var i = 0; i < eps.length; i++) {
                            if (eps[i].id === epSlug) { exists = true; break; }
                        }
                        if (!exists) eps.push({ id: epSlug, name: epName, slug: epSlug });
                    }
                }
            }
            return eps;
        }

        // Cắt riêng vùng code của từng Tab Thuyết Minh và Vietsub để tránh lẫn lộn
        var tmSplit = html.split('id="top-comment"');
        if (tmSplit.length > 1) {
            var tmHtml = tmSplit[1].split('id="new-comment"')[0] || tmSplit[1];
            var tmEpisodes = extractEpisodes(tmHtml);
            if (tmEpisodes.length > 0) servers.push({ name: "Thuyết Minh", episodes: tmEpisodes.reverse() }); // Reverse để tập 1 lên đầu
        }

        var vsSplit = html.split('id="new-comment"');
        if (vsSplit.length > 1) {
            var vsHtml = vsSplit[1].split('class="clearfix"')[0] || vsSplit[1];
            var vsEpisodes = extractEpisodes(vsHtml);
            if (vsEpisodes.length > 0) servers.push({ name: "Vietsub", episodes: vsEpisodes.reverse() });
        }

        // Fallback: Nếu web đổi giao diện ko có Tab, quét toàn trang
        if (servers.length === 0) {
            var allEpisodes = extractEpisodes(html);
            if (allEpisodes.length > 0) {
                servers.push({ name: "Server Phim", episodes: allEpisodes.reverse() });
            } else {
                // Xử lý nút "Xem ngay" cho phim lẻ (Chỉ có 1 tập)
                var watchBtn = html.match(/href="([^"]+)"[^>]*class="[^"]*btn-play[^"]*"/i) || html.match(/href="([^"]+)"[^>]*>[\s\S]*?Xem ngay/i);
                if (watchBtn) {
                    var epUrl = watchBtn[1];
                    var epSlug = epUrl.indexOf('yanhh3d.sh/') > -1 ? epUrl.split('yanhh3d.sh/')[1].replace(/\/+$/, '') : epUrl;
                    epSlug = epSlug.replace(/^\/+/, '');
                    servers.push({ name: "Server Phim", episodes: [{ id: epSlug, name: "Full", slug: epSlug }] });
                }
            }
        }

        return JSON.stringify({
            id: id, 
            title: title,
            posterUrl: posterUrl,
            backdropUrl: posterUrl,
            description: description,
            year: year,
            quality: quality,
            servers: servers 
        });
    } catch (error) { 
        return JSON.stringify({ servers: [] }); 
    }
}

// =============================================================================
// 5. PARSER: TÌM VÀ BÓC LINK VIDEO M3U8/IFRAME BỊ GIẤU
// =============================================================================
function parseDetailResponse(html) {
    try {
        var videoUrl = "";

        // Quét tìm tất cả các biến Javascript chứa link
        var checkLink1 = html.match(/var \$checkLink1 = "([^"]+)";/i);
        var checkLink2 = html.match(/var \$checkLink2 = "([^"]+)";/i);
        var checkLink3 = html.match(/var \$checkLink3 = "([^"]+)";/i);
        var checkLink4 = html.match(/var \$checkLink4 = "([^"]+)";/i);
        var checkLink5 = html.match(/var \$checkLink5 = "([^"]+)";/i);
        var checkLink6 = html.match(/var \$checkLink6 = "([^"]+)";/i);
        var checkLink7 = html.match(/var \$checkLink7 = "([^"]+)";/i);
        var checkLink8 = html.match(/var \$checkLink8 = "([^"]+)";/i);
        var checkLink9 = html.match(/var \$checkLink9 = "([^"]+)";/i);

        var allLinks = [];
        if (checkLink1 && checkLink1[1] !== "") allLinks.push(checkLink1[1]);
        if (checkLink2 && checkLink2[1] !== "") allLinks.push(checkLink2[1]);
        if (checkLink3 && checkLink3[1] !== "") allLinks.push(checkLink3[1]);
        if (checkLink4 && checkLink4[1] !== "") allLinks.push(checkLink4[1]);
        if (checkLink5 && checkLink5[1] !== "") allLinks.push(checkLink5[1]);
        if (checkLink6 && checkLink6[1] !== "") allLinks.push(checkLink6[1]);
        if (checkLink7 && checkLink7[1] !== "") allLinks.push(checkLink7[1]);
        if (checkLink8 && checkLink8[1] !== "") allLinks.push(checkLink8[1]);
        if (checkLink9 && checkLink9[1] !== "") allLinks.push(checkLink9[1]);

        // Ưu tiên 1: Link trực tiếp .m3u8 (Native Stream)
        for (var i = 0; i < allLinks.length; i++) {
            if (allLinks[i].indexOf('.m3u8') > -1) {
                videoUrl = allLinks[i];
                break;
            }
        }

        // Ưu tiên 2: Iframe uy tín
        if (videoUrl === "" && allLinks.length > 0) {
            videoUrl = allLinks[0]; // Dự phòng
            for (var j = 0; j < allLinks.length; j++) {
                if (allLinks[j].indexOf('avcaption.com') > -1 || allLinks[j].indexOf('play-fb-v8') > -1) {
                    videoUrl = allLinks[j];
                    break;
                }
            }
        }

        // Ưu tiên 3: Nếu web giấu thẳng trong Iframe thay vì JS
        if (videoUrl === "") {
            var iframeMatch = html.match(/<iframe[^>]*src="([^"]+)"/i);

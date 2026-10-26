const mysql = require("../mysql");
const path = require("path");

const getCategoryStats = async (req, res) => {
  try {
    const result = await mysql.query("getCategoryStats");

    res.status(200).json({
      success: true,
      data: result.recordset.map((stat) => ({
        category_id: stat.category_id,
        category_name: stat.category_name,
        total_downloads: parseInt(stat.total_downloads),
        file_count: parseInt(stat.file_count),
      })),
      message: "카테고리 통계 조회 성공",
    });
  } catch (error) {
    console.error("Error fetching category stats:", error);
    res.status(500).json({
      success: false,
      message: "카테고리 통계 조회 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const statsResult = await mysql.query("getDashboardStats");
    const totalsResult = await mysql.query("getDashboardTotals");
    const userTotalResult = await mysql.query("userTotal", { search: "", type: "all" });

    // 최근 등록/업데이트 컴포넌트 8개 (4열 2행)
    const recentResult = await mysql.query("fileList", {
      category_id: 0,
      sub_category_id: 0,
      search: "",
      type: "",
      model_type: "",
      sortBy: "latest",
      offset: 0,
      limit: 8,
    });

    // 인기 다운로드 컴포넌트 8개 (4열 2행)
    const popularResult = await mysql.query("fileList", {
      category_id: 0,
      sub_category_id: 0,
      search: "",
      type: "",
      model_type: "",
      sortBy: "downloads",
      offset: 0,
      limit: 8,
    });

    const formatFile = (file) => {
      let thumbnailPath = file.thumbnail_image
        ? `/uploads/thumbnails/${path.basename(file.thumbnail_image)}`
        : null;

      if (!thumbnailPath) {
        if (file.type === "vc_plugin" || file.type === "vc_model") thumbnailPath = "/uploads/thumbnails/ic-vc.png";
        else if (file.type === "ns_plugin" || file.type === "ns_model") thumbnailPath = "/uploads/thumbnails/ic-ns.png";
        else thumbnailPath = "/uploads/thumbnails/ic-etc.png";
      }

      return {
        id: file.id,
        component_id: file.component_id,
        file_name: file.file_name,
        version: file.version,
        type: file.type,
        model_type: file.model_type,
        thumbnail_image: thumbnailPath,
        created_at: file.registration_date || file.created_at,
        updated_at: file.updated_at || file.created_at,
        download_count: file.total_download_count ?? file.download_count ?? 0,
        file_path: file.file_path,
        source_file_link: file.file_path, // 하위 호환용
        vcmx_file_link: file.vcmx_file_link,
        fbx_file_link: file.fbx_file_link,
      };
    };

    const typeStatsMap = {
      vc_plugin: { component_count: 0, total_downloads: 0 },
      vc_model: { component_count: 0, total_downloads: 0 },
      ns_plugin: { component_count: 0, total_downloads: 0 },
      ns_model: { component_count: 0, total_downloads: 0 },
      etc: { component_count: 0, total_downloads: 0 },
    };

    (statsResult.recordset || []).forEach((row) => {
      if (row.type && typeStatsMap[row.type] !== undefined) {
        typeStatsMap[row.type] = {
          component_count: parseInt(row.component_count || 0),
          total_downloads: parseInt(row.total_downloads || 0),
        };
      }
    });

    const totals = totalsResult.recordset[0] || { total_components: 0, total_files: 0, total_downloads: 0 };
    const totalUsers = userTotalResult.recordset[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        typeStats: typeStatsMap,
        totals: {
          totalComponents: parseInt(totals.total_components || 0),
          totalFiles: parseInt(totals.total_files || 0),
          totalDownloads: parseInt(totals.total_downloads || 0),
          totalUsers: parseInt(totalUsers || 0),
        },
        recentFiles: (recentResult.recordset || []).map(formatFile),
        popularFiles: (popularResult.recordset || []).map(formatFile),
      },
      message: "대시보드 통계 조회 성공",
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "대시보드 통계 조회 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

module.exports = {
  getCategoryStats,
  getDashboardStats,
};

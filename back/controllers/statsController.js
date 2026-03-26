const mysql = require("../mysql");

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

module.exports = {
  getCategoryStats,
};

const mysql = require("../mysql");
const path = require("path");
const fs = require("fs").promises;
const fsSync = require("fs");

const getCategories = async (req, res) => {
  try {
    const result = await mysql.query("categoriesList");
    res.status(200).send(result.recordset);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).send({ error: "Failed to fetch categories" });
  }
};

// 새로운 카테고리 추가 함수
const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const userEmail = req.user.email;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "카테고리 이름은 필수입니다.",
      });
    }

    const result = await mysql.query("categoryCreate", { name: name });

    res.status(201).json({
      success: true,
      data: {
        id: result.recordset[0].id,
        name: name,
      },
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({
      success: false,
      message: "카테고리 생성 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

// 카테고리 수정 함수 (파일 마이그레이션 포함)
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // 입력값 검증
    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "카테고리 이름은 필수입니다.",
      });
    }

    // 카테고리 존재 여부 확인
    const categoryResult = await mysql.query("categoryGetById", { id: id });
    if (categoryResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "해당 카테고리를 찾을 수 없습니다.",
      });
    }

    const oldCategoryName = categoryResult.recordset[0].name;
    const newCategoryName = name.trim();

    // 카테고리명이 변경되지 않은 경우
    if (oldCategoryName === newCategoryName) {
      return res.status(200).json({
        success: true,
        message: "카테고리명이 동일합니다.",
        data: {
          id: parseInt(id),
          name: newCategoryName,
        },
      });
    }

    // 1. 카테고리 수정
    await mysql.query("categoryUpdate", { id: id, name: newCategoryName });

    // 2. 관련 파일들 마이그레이션
    const migrationResult = await migrateCategoryFiles(
      id,
      oldCategoryName,
      newCategoryName
    );

    res.status(200).json({
      success: true,
      message: "카테고리가 성공적으로 수정되었습니다.",
      data: {
        id: parseInt(id),
        name: newCategoryName,
        migration: migrationResult,
      },
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      success: false,
      message: "카테고리 수정 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

// 카테고리 삭제 함수 (소프트 삭제)
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // 카테고리 존재 여부 확인
    const categoryResult = await mysql.query("categoryGetById", { id: id });
    if (categoryResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "해당 카테고리를 찾을 수 없습니다.",
      });
    }

    await mysql.query("categoryDelete", { id: id });

    res.status(200).json({
      success: true,
      message: "카테고리가 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      success: false,
      message: "카테고리 삭제 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

// 카테고리 파일 마이그레이션 함수
const migrateCategoryFiles = async (
  categoryId,
  oldCategoryName,
  newCategoryName
) => {
  try {
    console.log(
      `카테고리 파일 마이그레이션 시작: ${oldCategoryName} → ${newCategoryName}`
    );

    // 해당 카테고리의 모든 파일 조회
    const filesResult = await mysql.query("getFilesByCategoryId", {
      category_id: categoryId,
    });
    const files = filesResult.recordset;

    if (files.length === 0) {
      return {
        success: true,
        message: "마이그레이션할 파일이 없습니다.",
        movedFiles: 0,
      };
    }

    let movedFiles = 0;
    let failedFiles = [];

    for (const file of files) {
      try {
        // 서브카테고리 정보 조회
        const subCategoryResult = await mysql.query("getSubCategoryById", {
          id: file.sub_category_id,
        });
        if (!subCategoryResult.recordset[0]) continue;

        const subCategoryName = subCategoryResult.recordset[0].name;
        const typePath = file.type === "object" ? "오브젝트" : "라이브러리";

        // 기존 경로와 새 경로
        const oldBasePath = path.join(
          __dirname,
          "..",
          "uploads",
          "vcmx",
          typePath,
          oldCategoryName,
          subCategoryName
        );
        const newBasePath = path.join(
          __dirname,
          "..",
          "uploads",
          "vcmx",
          typePath,
          newCategoryName,
          subCategoryName
        );

        // VCMX 파일이 있는 경우만 마이그레이션
        if (file.vcmx_file_link) {
          const filename = path.basename(file.vcmx_file_link);
          const oldFilePath = path.join(oldBasePath, filename);
          const newFilePath = path.join(newBasePath, filename);

          // 새 디렉토리 생성
          await fs.mkdir(newBasePath, { recursive: true });

          // 파일 이동
          if (fsSync.existsSync(oldFilePath)) {
            await fs.rename(oldFilePath, newFilePath);
            console.log(`파일 이동 완료: ${oldFilePath} → ${newFilePath}`);

            // DB의 vcmx_file_link도 업데이트
            const newVcmxLink = `/uploads/vcmx/${typePath}/${newCategoryName}/${subCategoryName}/${filename}`;
            await mysql.query("updateFileVcmxLink", {
              file_id: file.id,
              vcmx_file_link: newVcmxLink,
            });
            console.log(
              `DB 링크 업데이트: ${file.vcmx_file_link} → ${newVcmxLink}`
            );

            movedFiles++;
          }
        }
      } catch (fileError) {
        console.error(
          `파일 마이그레이션 실패 (ID: ${file.id}):`,
          fileError.message
        );
        failedFiles.push({
          fileId: file.id,
          fileName: file.file_name,
          error: fileError.message,
        });
      }
    }

    return {
      success: true,
      message: `${movedFiles}개 파일이 성공적으로 마이그레이션되었습니다.`,
      movedFiles,
      failedFiles,
    };
  } catch (error) {
    console.error("카테고리 파일 마이그레이션 에러:", error);
    throw error;
  }
};

// 서브카테고리 생성 함수
const createSubCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "서브카테고리 이름은 필수입니다.",
      });
    }

    // 메인 카테고리 존재 여부 확인
    const categoryResult = await mysql.query("categoryGetById", {
      id: categoryId,
    });
    if (categoryResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "해당 메인 카테고리를 찾을 수 없습니다.",
      });
    }

    const result = await mysql.query("subCategoryCreate", {
      name: name.trim(),
      main_category_id: parseInt(categoryId),
    });

    res.status(201).json({
      success: true,
      message: "서브카테고리가 성공적으로 생성되었습니다.",
      data: {
        id: result.recordset[0].id,
        name: name.trim(),
        category_id: parseInt(categoryId),
      },
    });
  } catch (error) {
    console.error("서브카테고리 생성 에러:", error);
    res.status(500).json({
      success: false,
      message: "서브카테고리 생성 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

// 서브카테고리 수정 함수
const updateSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "서브카테고리 이름은 필수입니다.",
      });
    }

    // 서브카테고리 존재 여부 확인
    const subCategoryResult = await mysql.query("getSubCategoryById", {
      id: id,
    });
    if (subCategoryResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "해당 서브카테고리를 찾을 수 없습니다.",
      });
    }

    const oldSubCategoryName = subCategoryResult.recordset[0].name;
    const newSubCategoryName = name.trim();

    // 서브카테고리명이 변경되지 않은 경우
    if (oldSubCategoryName === newSubCategoryName) {
      return res.status(200).json({
        success: true,
        message: "서브카테고리명이 동일합니다.",
        data: {
          id: parseInt(id),
          name: newSubCategoryName,
        },
      });
    }

    // 1. 서브카테고리 수정
    await mysql.query("subCategoryUpdate", {
      id: id,
      name: newSubCategoryName,
    });

    // 2. 관련 파일들 마이그레이션
    const migrationResult = await migrateSubCategoryFiles(
      id,
      oldSubCategoryName,
      newSubCategoryName
    );

    res.status(200).json({
      success: true,
      message: "서브카테고리가 성공적으로 수정되었습니다.",
      data: {
        id: parseInt(id),
        name: newSubCategoryName,
        migration: migrationResult,
      },
    });
  } catch (error) {
    console.error("서브카테고리 수정 에러:", error);
    res.status(500).json({
      success: false,
      message: "서브카테고리 수정 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

// 서브카테고리 삭제 함수
const deleteSubCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // 서브카테고리 존재 여부 확인
    const subCategoryResult = await mysql.query("getSubCategoryById", {
      id: id,
    });
    if (subCategoryResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "해당 서브카테고리를 찾을 수 없습니다.",
      });
    }

    // 해당 서브카테고리를 사용하는 파일이 있는지 확인
    const filesResult = await mysql.query("getFilesBySubCategoryId", {
      sub_category_id: id,
    });
    if (filesResult.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: "해당 서브카테고리를 사용하는 파일이 있어 삭제할 수 없습니다.",
        fileCount: filesResult.recordset.length,
      });
    }

    await mysql.query("subCategoryDelete", { id: id });

    res.status(200).json({
      success: true,
      message: "서브카테고리가 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    console.error("서브카테고리 삭제 에러:", error);
    res.status(500).json({
      success: false,
      message: "서브카테고리 삭제 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

// 서브카테고리 파일 마이그레이션 함수
const migrateSubCategoryFiles = async (
  subCategoryId,
  oldSubCategoryName,
  newSubCategoryName
) => {
  try {
    console.log(
      `서브카테고리 파일 마이그레이션 시작: ${oldSubCategoryName} → ${newSubCategoryName}`
    );

    // 해당 서브카테고리의 모든 파일 조회
    const filesResult = await mysql.query("getFilesBySubCategoryId", {
      sub_category_id: subCategoryId,
    });
    const files = filesResult.recordset;

    if (files.length === 0) {
      return {
        success: true,
        message: "마이그레이션할 파일이 없습니다.",
        movedFiles: 0,
      };
    }

    let movedFiles = 0;
    let failedFiles = [];

    for (const file of files) {
      try {
        // 메인 카테고리 정보 조회
        const categoryResult = await mysql.query("getCategoryById", {
          id: file.category_id,
        });
        if (!categoryResult.recordset[0]) continue;

        const categoryName = categoryResult.recordset[0].name;
        const typePath = file.type === "object" ? "오브젝트" : "라이브러리";

        // 기존 경로와 새 경로
        const oldBasePath = path.join(
          __dirname,
          "..",
          "uploads",
          "vcmx",
          typePath,
          categoryName,
          oldSubCategoryName
        );
        const newBasePath = path.join(
          __dirname,
          "..",
          "uploads",
          "vcmx",
          typePath,
          categoryName,
          newSubCategoryName
        );

        // VCMX 파일이 있는 경우만 마이그레이션
        if (file.vcmx_file_link) {
          const filename = path.basename(file.vcmx_file_link);
          const oldFilePath = path.join(oldBasePath, filename);
          const newFilePath = path.join(newBasePath, filename);

          // 새 디렉토리 생성
          await fs.mkdir(newBasePath, { recursive: true });

          // 파일 이동
          if (fsSync.existsSync(oldFilePath)) {
            await fs.rename(oldFilePath, newFilePath);
            console.log(`파일 이동 완료: ${oldFilePath} → ${newFilePath}`);

            // DB의 vcmx_file_link도 업데이트
            const newVcmxLink = `/uploads/vcmx/${typePath}/${categoryName}/${newSubCategoryName}/${filename}`;
            await mysql.query("updateFileVcmxLink", {
              file_id: file.id,
              vcmx_file_link: newVcmxLink,
            });
            console.log(
              `DB 링크 업데이트: ${file.vcmx_file_link} → ${newVcmxLink}`
            );

            movedFiles++;
          }
        }
      } catch (fileError) {
        console.error(
          `파일 마이그레이션 실패 (ID: ${file.id}):`,
          fileError.message
        );
        failedFiles.push({
          fileId: file.id,
          fileName: file.file_name,
          error: fileError.message,
        });
      }
    }

    return {
      success: true,
      message: `${movedFiles}개 파일이 성공적으로 마이그레이션되었습니다.`,
      movedFiles,
      failedFiles,
    };
  } catch (error) {
    console.error("서브카테고리 파일 마이그레이션 에러:", error);
    throw error;
  }
};

const getSubCategories = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);

    if (!categoryId || isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "유효하지 않은 카테고리 ID입니다.",
      });
    }

    const result = await mysql.query("getSubCategories", {
      category_id: categoryId,
    });

    res.status(200).json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("서브 카테고리 조회 에러:", error);
    res.status(500).json({
      success: false,
      message: "서브 카테고리 조회 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getSubCategories,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
};

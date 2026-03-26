const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mssql = require("../mysql");

const getUsers = async (req, res) => {
  try {
    // 관리자 권한 체크
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "관리자만 사용자 목록을 조회할 수 있습니다.",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const type = req.query.type || "all"; // all, username, email, department
    const sortBy = req.query.sortBy || "id";
    const offset = (page - 1) * limit;

    const searchParams = {
      search: search,
      type: type,
      sortBy: sortBy,
      offset: offset,
      limit: limit,
    };

    const totalResult = await mssql.query("userTotal", searchParams);
    const users = await mssql.query("userList", searchParams);

    res.status(200).json({
      users: users.recordset,
      totalPages: Math.ceil(totalResult.recordset[0].total / limit),
      currentPage: page,
      total: totalResult.recordset[0].total,
    });
  } catch (error) {
    console.error("사용자 조회 에러:", error);
    res.status(500).json({
      success: false,
      message: "사용자 목록 조회 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // 이메일 입력 확인
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "이메일을 입력해주세요.",
      });
    }

    // 이메일 형식 검증 (간단한 정규식)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "올바른 이메일 형식이 아닙니다.",
      });
    }

    // 데이터베이스에서 이메일 중복 확인
    const result = await mssql.query("checkEmailExists", { email: email });

    if (result.recordset.length > 0) {
      // 이메일이 이미 존재함
      return res.status(409).json({
        success: false,
        message: "이미 사용 중인 이메일입니다.",
        available: false,
      });
    }

    // 이메일 사용 가능
    res.status(200).json({
      success: true,
      message: "사용 가능한 이메일입니다.",
      available: true,
    });
  } catch (error) {
    console.error("이메일 중복 체크 에러:", error);
    res.status(500).json({
      success: false,
      message: "이메일 중복 확인 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

const signup = async (req, res) => {
  try {
    const { email, pwd, username, department, position, phone_number, role } =
      req.body;

    if (!email || !pwd || !username) {
      return res.status(400).json({
        success: false,
        message:
          "필수 항목이 누락되었습니다. (이메일, 비밀번호, 사용자명은 필수입니다)",
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(pwd, saltRounds);

    const signupParams = {
      email: email,
      pwd: hashedPassword,
      username: username,
      department: department,
      position: position,
      phone_number: phone_number,
      role: role || "user",
    };

    const result = await mssql.query("userSignup", signupParams);

    res.status(201).json({
      success: true,
      message: "회원가입이 완료되었습니다.",
    });
  } catch (error) {
    if (error.number === 2627) {
      // MSSQL 중복 키 에러 코드
      return res.status(409).json({
        success: false,
        message: "이미 등록된 이메일입니다.",
      });
    }
    res.status(500).json({
      success: false,
      message: "회원가입 처리 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, pwd } = req.body;

    if (!email || !pwd) {
      return res.status(400).json({
        success: false,
        message: "이메일과 비밀번호를 모두 입력해주세요.",
      });
    }

    const result = await mssql.query("userLogin", { email: email });

    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: "이메일 또는 비밀번호가 올바르지 않습니다.",
      });
    }

    const user = result.recordset[0];
    const isPasswordValid = await bcrypt.compare(pwd, user.pwd);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "이메일 또는 비밀번호가 올바르지 않습니다.",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    const refreshToken = jwt.sign(
      {
        id: user.id,
      },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: "7d",
      }
    );

    await mssql.query("updateUserLastLogin", { id: user.id });

    res.status(200).json({
      success: true,
      message: "로그인 성공",
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("로그인 에러:", error);
    res.status(500).json({
      success: false,
      message: "로그인 처리 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

const getProfile = async (req, res) => {
  try {
    // 관리자 권한 체크
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "관리자만 사용자 프로필을 조회할 수 있습니다.",
      });
    }

    // URL 파라미터에서 사용자 ID 받기 (관리자가 특정 사용자 조회)
    const userId = req.params.id || req.user.id;

    const result = await mssql.query("getUserById", { id: userId });

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "사용자를 찾을 수 없습니다.",
      });
    }

    const user = result.recordset[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        department: user.department,
        position: user.position,
        phone_number: user.phone_number,
        role: user.role,
        is_approved: user.is_approved,
        created_at: user.created_at,
        last_login: user.last_login,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "프로필 조회 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, department, position, phone_number, is_approved, role } =
      req.body;

    // 관리자 권한 체크 강화
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "관리자만 사용자 정보를 수정할 수 있습니다.",
      });
    }

    const userResult = await mssql.query("getUserById", { id: id });
    if (userResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "해당 사용자를 찾을 수 없습니다.",
      });
    }

    const user = userResult.recordset[0];
    let approvalStatus = user.is_approved;
    if (is_approved !== undefined) {
      if (![0, 1].includes(Number(is_approved))) {
        return res.status(400).json({
          success: false,
          message: "승인 상태는 0(대기중) 또는 1(승인됨)이어야 합니다.",
        });
      }
      approvalStatus = Number(is_approved);
    }

    const updateData = {
      id: id,
      username: username || user.username,
      department: department || user.department,
      position: position || user.position,
      phone_number: phone_number || user.phone_number,
      is_approved: approvalStatus,
      role: role || user.role,
    };

    await mssql.query("updateUser", updateData);

    const updatedUserResult = await mssql.query("getUserById", { id: id });
    const updatedUser = updatedUserResult.recordset[0];

    res.status(200).json({
      success: true,
      message: "사용자 정보가 성공적으로 수정되었습니다.",
      data: {
        ...updatedUser,
        is_approved: updatedUser.is_approved,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "사용자 정보 수정 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

const deleteUsers = async (req, res) => {
  try {
    // 관리자 권한 체크
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "관리자만 사용자를 삭제할 수 있습니다.",
      });
    }

    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "삭제할 사용자 ID 목록이 필요합니다.",
      });
    }

    if (userIds.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: "관리자 본인은 삭제할 수 없습니다.",
      });
    }

    const result = await mssql.query("deleteUsers", { ids: userIds.join(",") });

    res.status(200).json({
      success: true,
      message: "선택한 사용자들이 성공적으로 삭제되었습니다.",
      data: {
        deletedIds: userIds,
      },
    });
  } catch (error) {
    console.error("Error deleting users:", error);
    res.status(500).json({
      success: false,
      message: "사용자 삭제 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

module.exports = {
  getUsers,
  checkEmail,
  signup,
  login,
  getProfile,
  updateUser,
  deleteUsers,
};

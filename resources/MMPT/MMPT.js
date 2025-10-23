// ====================== 工具函数 ======================

// 解析节次字符串 -> 开始节次和结束节次
function parseSections(sectionStr) {
    if (!sectionStr) return { start: 1, end: 1 };
    
    // 处理 "1-2节" 或 "3-4节" 等格式
    const match = sectionStr.match(/(\d+)-(\d+)节?/);
    if (match) {
        return {
            start: parseInt(match[1]),
            end: parseInt(match[2])
        };
    }
    
    // 处理单个节次 "1节" 等
    const singleMatch = sectionStr.match(/(\d+)节?/);
    if (singleMatch) {
        const num = parseInt(singleMatch[1]);
        return { start: num, end: num };
    }
    
    return { start: 1, end: 1 };
}

// 解析周次字符串 -> 数字数组
function parseWeeks(weekStr) {
    const weeks = new Set();
    if (!weekStr) return [];
    
    // 处理各种周次格式
    const parts = weekStr.split(',');
    for (const part of parts) {
        const trimmed = part.trim();
        
        if (trimmed.includes('-')) {
            // 处理范围，如 "1-19周" 或 "2-12周"
            const rangeMatch = trimmed.match(/(\d+)-(\d+)/);
            if (rangeMatch) {
                const start = parseInt(rangeMatch[1]);
                const end = parseInt(rangeMatch[2]);
                for (let i = start; i <= end && i <= 20; i++) {
                    weeks.add(i);
                }
            }
        } else if (trimmed.includes('周')) {
            // 处理单个周次，如 "15周"
            const singleMatch = trimmed.match(/(\d+)/);
            if (singleMatch) {
                const week = parseInt(singleMatch[1]);
                if (week >= 1 && week <= 20) {
                    weeks.add(week);
                }
            }
        } else if (trimmed.includes('(单)')) {
            // 处理单周，如 "15-17周(单)" 表示15,17周
            const rangeMatch = trimmed.match(/(\d+)-(\d+)/);
            if (rangeMatch) {
                const start = parseInt(rangeMatch[1]);
                const end = parseInt(rangeMatch[2]);
                for (let i = start; i <= end; i += 2) { // 单周
                    if (i >= 1 && i <= 20) {
                        weeks.add(i);
                    }
                }
            }
        } else {
            // 处理纯数字
            const singleMatch = trimmed.match(/(\d+)/);
            if (singleMatch) {
                const week = parseInt(singleMatch[1]);
                if (week >= 1 && week <= 20) {
                    weeks.add(week);
                }
            }
        }
    }
    
    return Array.from(weeks).sort((a, b) => a - b);
}

// 合并重复课程
function mergeDuplicateCourses(courses) {
    const merged = [];
    const keyMap = {}; // key = name+day+startSection+endSection+position

    for (const c of courses) {
        const key = `${c.name}|${c.day}|${c.startSection}|${c.endSection}|${c.position}`;
        if (!keyMap[key]) {
            keyMap[key] = { ...c, weeks: [...c.weeks] };
        } else {
            keyMap[key].weeks = Array.from(new Set([...keyMap[key].weeks, ...c.weeks]));
        }
    }

    for (const k in keyMap) merged.push(keyMap[k]);
    return merged;
}

const MMPT_CONFIG = {
    name: '茂名职业技术学院',
    domains: ['mmpt.edu.cn', 'mmvtc.edu.cn'],
    jwcUrl: 'https://jwc.mmpt.edu.cn',
    apiPath: '/kbcx/xskbcx_cxXsgrkb.html?gnmkdm=N2151'
};

// 茂名职业技术学院作息时间表配置
const MMVT_SCHEDULE_CONFIG = {
    '南校区': {
        timeSlots: [
            { number: 1, startTime: "08:20", endTime: "09:00" },
            { number: 2, startTime: "09:10", endTime: "09:50" },
            { number: 3, startTime: "10:00", endTime: "10:40" },
            { number: 4, startTime: "10:50", endTime: "11:30" },
            { number: 5, startTime: "11:40", endTime: "12:20" },
            { number: 6, startTime: "14:30", endTime: "15:10" },
            { number: 7, startTime: "15:20", endTime: "16:00" },
            { number: 8, startTime: "16:15", endTime: "16:55" },
            { number: 9, startTime: "17:05", endTime: "17:45" },
            { number: 10, startTime: "19:00", endTime: "19:40" },
            { number: 11, startTime: "19:50", endTime: "20:30" },
            { number: 12, startTime: "20:40", endTime: "21:20" }
        ]
    },
    '北校区': {
        timeSlots: [
            { number: 1, startTime: "08:00", endTime: "08:40" },
            { number: 2, startTime: "08:50", endTime: "09:30" },
            { number: 3, startTime: "09:40", endTime: "10:20" },
            { number: 4, startTime: "10:30", endTime: "11:10" },
            { number: 5, startTime: "11:20", endTime: "12:00" },
            { number: 6, startTime: "14:30", endTime: "15:10" },
            { number: 7, startTime: "15:20", endTime: "16:00" },
            { number: 8, startTime: "16:15", endTime: "16:55" },
            { number: 9, startTime: "17:05", endTime: "17:45" },
            { number: 10, startTime: "19:00", endTime: "19:40" },
            { number: 11, startTime: "19:50", endTime: "20:30" },
            { number: 12, startTime: "20:40", endTime: "21:20" }
        ]
    }
};


// 获取MMPT配置（无需选择，直接使用）
function getMMPTConfig() {
    return MMPT_CONFIG;
}

// 选择校区时间表
async function selectCampusSchedule() {
    const campuses = Object.keys(MMVT_SCHEDULE_CONFIG);
    const campusIndex = await window.AndroidBridgePromise.showSingleSelection(
        "选择校区时间表", 
        JSON.stringify(campuses),
        -1
    );
    
    if (campusIndex === null) {
        AndroidBridge.showToast("未选择校区，使用南校区时间表");
        return MMVT_SCHEDULE_CONFIG['南校区'];
    }
    
    return MMVT_SCHEDULE_CONFIG[campuses[campusIndex]];
}


// 选择学年
async function selectAcademicYear() {
    const currentYear = new Date().getFullYear();
    const years = [];
    
    // 生成最近3年的学年选项，格式为 xxxx-xxxx
    for (let i = 0; i < 3; i++) {
        const year = currentYear - i;
        years.push(`${year}-${year + 1}`);
    }
    
    const yearIndex = await window.AndroidBridgePromise.showSingleSelection(
        "选择学年", 
        JSON.stringify(years),
        0 // 默认选择当前学年
    );
    
    if (yearIndex === null) {
        return currentYear; // 默认当前学年
    }
    
    return currentYear - yearIndex;
}

// 选择学期
async function selectSemester() {
    const semesters = ["第一学期", "第二学期"];
    const semesterIndex = await window.AndroidBridgePromise.showSingleSelection(
        "选择学期", 
        JSON.stringify(semesters),
        -1
    );
    
    if (semesterIndex === null) {
        return "3"; // 默认第一学期
    }
    
    return semesterIndex === 0 ? "3" : "12";
}

// ====================== 获取课程数据 ======================
async function fetchCourseData() {
    try {
        // 使用MMPT配置，让用户选择学年和学期
        const schoolConfig = getMMPTConfig();
        const academicYear = await selectAcademicYear();
        const semester = await selectSemester();
        
        console.log(`使用学校配置: ${schoolConfig.name}`);
        console.log(`选择学年: ${academicYear}, 选择学期: ${semester}`);
        
        // 构建完整的API URL
        const apiUrl = schoolConfig.jwcUrl + schoolConfig.apiPath;
        
        // 从新系统获取课程数据
        // 使用POST请求获取完整的课程数据
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: new URLSearchParams({
                'xnm': academicYear,   // 用户选择的学年
                'xqm': semester,      // 用户选择的学期（3或12）
                'kzlx': 'ck',         // 课程类型
                'xsdm': '',           // 学生代码
                'kclbdm': ''          // 课程类别代码
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (err) {
        console.error("获取课程数据失败:", err);
        AndroidBridge.showToast("获取课程数据失败：" + err.message);
        return null;
    }
}

// ====================== 解析课程数据 ======================
function parseCourseData(responseData) {
    const courses = [];
    
    if (!responseData || !responseData.kbList) {
        console.error("响应数据格式不正确");
        return [];
    }
    
    responseData.kbList.forEach(course => {
        try {
            // 解析节次
            const sections = parseSections(course.jc);
            
            // 解析周次
            const weeks = parseWeeks(course.zcd);
            
            if (weeks.length === 0) {
                console.warn(`课程 ${course.kcmc} 没有有效的周次信息`);
                return;
            }
            
            courses.push({
                name: course.kcmc || "未知课程",
                teacher: course.xm || "未知教师",
                position: course.cdmc || "未知教室",
                day: parseInt(course.xqj) || 1,
                startSection: sections.start,
                endSection: sections.end,
                weeks: weeks
            });
        } catch (err) {
            console.error(`解析课程数据失败:`, err, course);
        }
    });
    
    return courses;
}

// ====================== 保存课程 ======================
async function saveCourses(courses) {
    try {
        const result = await window.AndroidBridgePromise.saveImportedCourses(JSON.stringify(courses));
        if (result === true) {
            AndroidBridge.showToast("课程导入成功！");
            return true;
        } else {
            AndroidBridge.showToast("课程导入失败，请查看日志！");
            return false;
        }
    } catch (err) {
        console.error("保存课程失败:", err);
        AndroidBridge.showToast("保存课程失败：" + err.message);
        return false;
    }
}

// ====================== 导入预设时间段（根据选择的校区） ======================
async function importPresetTimeSlots() {
    try {
        // 让用户选择校区时间表
        const campusConfig = await selectCampusSchedule();
        const timeSlots = campusConfig.timeSlots;
        
        console.log(`使用校区时间表: ${campusConfig.name || '未知校区'}`);
        console.log(`时间段数量: ${timeSlots.length}`);
        
        const result = await window.AndroidBridgePromise.savePresetTimeSlots(JSON.stringify(timeSlots));
        if (result === true) {
            AndroidBridge.showToast(`时间段导入成功！共导入${timeSlots.length}个时间段`);
        } else {
            AndroidBridge.showToast("时间段导入失败，请查看日志！");
        }
    } catch (err) {
        console.error("时间段导入失败:", err);
        AndroidBridge.showToast("时间段导入失败：" + err.message);
    }
}

// ====================== 主流程 ======================
async function runImportFlow() {
    AndroidBridge.showToast("课程导入流程即将开始...");

    try {
        // 1️⃣ 获取课程数据（选择学年学期）
        AndroidBridge.showToast("请选择学年和学期...");
        
        // 从新系统获取课程数据
        const responseData = await fetchCourseData();
        if (!responseData) {
            AndroidBridge.showToast("获取课程数据失败！");
            AndroidBridge.notifyTaskCompletion();
            return;
        }
        
        // 2️⃣ 解析课程数据
        AndroidBridge.showToast("正在解析课程数据...");
        const courses = parseCourseData(responseData);
        if (!courses || courses.length === 0) {
            AndroidBridge.showToast("未找到课程数据！");
            AndroidBridge.notifyTaskCompletion();
            return;
        }
        
        // 3️⃣ 合并重复课程
        AndroidBridge.showToast("正在合并重复课程...");
        const mergedCourses = mergeDuplicateCourses(courses);
        
        // 4️⃣ 保存课程
        AndroidBridge.showToast("正在保存课程数据...");
        const saveResult = await saveCourses(mergedCourses);
        if (!saveResult) {
            AndroidBridge.notifyTaskCompletion();
            return;
        }

        // 5️⃣ 导入预设时间段（用户选择校区）
        AndroidBridge.showToast("请选择校区时间表...");
        await importPresetTimeSlots();

        AndroidBridge.showToast("所有任务完成！");
        AndroidBridge.notifyTaskCompletion();
        
    } catch (err) {
        console.error("导入流程失败:", err);
        AndroidBridge.showToast("导入失败：" + err.message);
        AndroidBridge.notifyTaskCompletion();
    }
}

// 启动流程
runImportFlow();
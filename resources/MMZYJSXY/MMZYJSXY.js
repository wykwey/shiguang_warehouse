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

// ====================== 获取课程数据 ======================
async function fetchCourseData() {
    try {
        // 从新系统获取课程数据
        // 使用POST请求获取完整的课程数据
        const response = await fetch("https://jwc.mmpt.edu.cn/kbcx/xskbcx_cxXsgrkb.html?gnmkdm=N2151", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: new URLSearchParams({
                'xnm': '2025',        // 学年
                'xqm': '3',           // 学期
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

// ====================== 导入预设时间段（实际大节时间） ======================
async function importPresetTimeSlots() {
    // 调整后的课程大节时间，端点衔接，总时长不变
    const presetTimeSlots = [
        { number: 1, startTime: "08:30", endTime: "09:15" }, // 第一大节第一部分
        { number: 2, startTime: "09:15", endTime: "10:00" }, // 第一大节第二部分
        { number: 3, startTime: "10:20", endTime: "11:05" }, // 第二大节第一部分
        { number: 4, startTime: "11:05", endTime: "11:50" }, // 第二大节第二部分
        { number: 5, startTime: "14:20", endTime: "15:05" }, // 第三大节第一部分
        { number: 6, startTime: "15:05", endTime: "15:50" }, // 第三大节第二部分
        { number: 7, startTime: "16:10", endTime: "16:55" }, // 第四大节第一部分
        { number: 8, startTime: "16:55", endTime: "17:40" }, // 第四大节第二部分
        { number: 9, startTime: "18:00", endTime: "18:45" }, // 第五大节第一部分
        { number: 10, startTime: "18:45", endTime: "19:00" }, // 第五大节第二部分
        { number: 11, startTime: "19:00", endTime: "19:45" }, // 第六大节第一部分
        { number: 12, startTime: "19:45", endTime: "20:30" }  // 第六大节第二部分
    ];
    
    try {
        const result = await window.AndroidBridgePromise.savePresetTimeSlots(JSON.stringify(presetTimeSlots));
        if (result === true) {
            AndroidBridge.showToast("时间段导入成功！");
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
        // 1️⃣ 获取课程数据
        AndroidBridge.showToast("正在获取课程数据...");
        
        // 从新系统获取课程数据
        const responseData = await fetchCourseData();
        if (!responseData) {
            AndroidBridge.showToast("获取课程数据失败！");
            AndroidBridge.notifyTaskCompletion();
            return;
        }
        
        // 2️⃣ 解析课程数据
        const courses = parseCourseData(responseData);
        if (!courses || courses.length === 0) {
            AndroidBridge.showToast("未找到课程数据！");
            AndroidBridge.notifyTaskCompletion();
            return;
        }
        
        // 3️⃣ 合并重复课程
        const mergedCourses = mergeDuplicateCourses(courses);
        
        // 4️⃣ 保存课程
        const saveResult = await saveCourses(mergedCourses);
        if (!saveResult) {
            AndroidBridge.notifyTaskCompletion();
            return;
        }

        // 5️⃣ 导入预设时间段
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
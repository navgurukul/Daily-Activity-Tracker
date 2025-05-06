import AWS from 'aws-sdk';

const docClient = new AWS.DynamoDB.DocumentClient({ region: 'ap-south-1' });

const EMPLOYEE_TABLE = 'employeeDailyActivityLogs';
const LEAVE_TABLE = 'hrmsLeaveRequests';
const EXTERNAL_API = 'https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=pncdata';

function getWeekOfMonth(date) {
  const day = date.getDate();
  return Math.ceil(day / 7);
}

function isSameMonth(date, year, month) {
  return date.getFullYear() === year && date.getMonth() === month;
}

function isWeekOff(date) {
  const day = date.getDay();
  const dateNum = date.getDate();
  const isSecondSaturday = day === 6 && dateNum >= 8 && dateNum <= 14;
  const isFourthSaturday = day === 6 && dateNum >= 22 && dateNum <= 28;
  return day === 0 || isSecondSaturday || isFourthSaturday;
}

async function fetchAllEmployees() {
  try {
    const res = await fetch(EXTERNAL_API);
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data.map(entry => ({
        email: entry['Team ID'],
        name: entry['First and Last Name'],
        teamName: entry['Work Location Type'],
      }));
    }
  } catch (error) {
    console.error('Error fetching employee list:', error);
  }
  return [];
}

async function scanTable(tableName) {
  const params = { TableName: tableName };
  let items = [], lastEvaluatedKey = null;

  do {
    if (lastEvaluatedKey) params.ExclusiveStartKey = lastEvaluatedKey;
    const data = await docClient.scan(params).promise();
    items = items.concat(data.Items);
    lastEvaluatedKey = data.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return items;
}

function calculatePaidLeaves(leaves, year, month) {
  const leaveMap = {};

  for (const leave of leaves) {
    if (leave.status === 'rejected' || leave.leaveType === 'LWP' || !leave.startDate || !leave.endDate) continue;

    const leaveType = leave.leaveType.toLowerCase();
    if (leaveType.includes('compensatory leave')) continue;

    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    const email = leave.userEmail;
    const isHalfDay = leave.durationType === 'Half Day';

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      if (isSameMonth(date, year, month)) {
        leaveMap[email] = (leaveMap[email] || 0) + (isHalfDay ? 0.5 : 1);
      }
    }
  }
  return leaveMap;
}

function calculateCompOffLeaves(leaves, year, month) {
  const compOffMap = {};

  for (const leave of leaves) {
    if (leave.status === 'rejected' || !leave.leaveType || !leave.startDate || !leave.endDate) continue;

    const leaveType = leave.leaveType.toLowerCase();
    if (!leaveType.includes('compensatory leave')) continue;

    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    const email = leave.userEmail;
    const isHalfDay = leave.durationType === 'Half Day';

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      if (isSameMonth(date, year, month)) {
        compOffMap[email] = (compOffMap[email] || 0) + (isHalfDay ? 0.5 : 1);
      }
    }
  }
  return compOffMap;
}

function countWeekOffDays(year, month, userLogDates, userWeekendLogs) {
  const totalDays = new Date(year, month + 1, 0).getDate();
  let weekOffCount = 0;

  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, month, d);
    const dateStr = date.toISOString().split('T')[0];
    if (isWeekOff(date)) {
      if (!userWeekendLogs.has(dateStr)) {
        weekOffCount++;
      }
    }
  }
  return weekOffCount;
}

async function calculateHours(year, month) {
  const allEmployees = await fetchAllEmployees();
  const logs = (await scanTable(EMPLOYEE_TABLE)).filter(item => {
    if (!item.entryDate) return false;
    const date = new Date(item.entryDate);
    return isSameMonth(date, year, month);
  });

  const leaveRequests = await scanTable(LEAVE_TABLE);
  const paidLeaveMap = calculatePaidLeaves(leaveRequests, year, month);
  const compOffMap = calculateCompOffLeaves(leaveRequests, year, month);

  const groupedByEmail = {};
  for (const log of logs) {
    const email = log.email;
    if (!groupedByEmail[email]) groupedByEmail[email] = [];
    groupedByEmail[email].push(log);
  }

  const result = [];

  for (const emp of allEmployees) {
    const empLogs = groupedByEmail[emp.email] || [];

    const weekData = {
      email: emp.email,
      name: emp.name,
      teamName: emp.teamName,
      'Week 1': 0,
      'Week 2': 0,
      'Week 3': 0,
      'Week 4': 0,
      'Week 5': 0,
      totalHours: 0,
      totalWorkingDays: 0,
      paidLeaves: paidLeaveMap[emp.email] || 0,
      totalCompOffLeaveTaken: compOffMap[emp.email] || 0,
      weekOffDays: 0,
      totalPayableDays: 0,
      numOfWorkOnWeekendDays: 0
    };

    const uniqueDates = new Set();
    const weekendWorkDates = new Set();

    for (const log of empLogs) {
      const entryDate = new Date(log.entryDate);
      const dateStr = entryDate.toISOString().split('T')[0];
      const week = Math.min(getWeekOfMonth(entryDate), 5);
      const weekKey = `Week ${week}`;
      const hours = parseFloat(log.totalHoursSpent || 0);

      weekData[weekKey] += hours;
      weekData.totalHours += hours;
      uniqueDates.add(dateStr);

      if (isWeekOff(entryDate)) {
        weekendWorkDates.add(dateStr);
      }
    }

    weekData.totalWorkingDays = uniqueDates.size;
    weekData.numOfWorkOnWeekendDays = weekendWorkDates.size;
    weekData.weekOffDays = countWeekOffDays(year, month, uniqueDates, weekendWorkDates);
    weekData.totalPayableDays = weekData.totalWorkingDays + weekData.weekOffDays + weekData.totalCompOffLeaveTaken + weekData.paidLeaves - weekData.numOfWorkOnWeekendDays;

    result.push(weekData);
  }

  return result;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const inputYear = parseInt(process.argv[2], 10);
  const inputMonth = parseInt(process.argv[3], 10);

  const today = new Date();
  const year = !isNaN(inputYear) ? inputYear : today.getFullYear();
  const month = !isNaN(inputMonth) ? inputMonth : today.getMonth();

  calculateHours(year, month).then(data =>
    console.log(JSON.stringify(data, null, 2))
  );
}

export const handler = async (event) => {
  const queryParams = event.queryStringParameters || {};
  const year = parseInt(queryParams.year) || new Date().getFullYear();
  const month = parseInt(queryParams.month) || new Date().getMonth();

  const data = await calculateHours(year, month);
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',        // ⭐ Allow from all origins
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',  // ⭐ Allow these methods
      'Access-Control-Allow-Headers': 'Content-Type',  // ⭐ Allow this header
    },
    body: JSON.stringify(data),
  };
};

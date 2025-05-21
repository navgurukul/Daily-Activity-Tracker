import AWS from 'aws-sdk';
import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client();
const docClient = new AWS.DynamoDB.DocumentClient({ region: 'ap-south-1' });

const EMPLOYEE_TABLE = 'employeeDailyActivityLogs';
const LEAVE_TABLE = 'hrmsLeaveRequests';
const EXTERNAL_API = 'https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=pncdata';

function getWeekOfMonth(date) {
  const day = date.getDate();
  return Math.ceil(day / 7);
}

async function verifyGoogleToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('Missing or invalid Authorization header');
    error.statusCode = 401;
    throw "invalid token";
  }

  const token = authHeader.split(' ')[1];

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: "34917283366-b806koktimo2pod1cjas8kn2lcpn7bse.apps.googleusercontent.com"
    });
    const payload = ticket.getPayload();
    return payload?.email;
  } catch (err) {
    console.error('Token verification failed:', err.message);
    const error = new Error('Invalid or expired token');
    error.statusCode = 401;
    throw err;
  }
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

function getCycle(date) {
  const day = date.getDate();
  return day <= 25 ? 'cycle1' : 'cycle2';
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

async function calculateHours(year, month) {
  const HOLIDAY_DATES = [
    { month: 0, date: 26 },   // 26 Jan
    { month: 7, date: 15 },   // 15 Aug
    { month: 9, date: 2 },    // 2 Oct
    { month: 11, date: 31 },  // 31 Dec
  ];

  const allEmployees = await fetchAllEmployees();
  const logs = (await scanTable(EMPLOYEE_TABLE)).filter(item => {
    if (!item.entryDate) return false;
    const date = new Date(item.entryDate);
    return isSameMonth(date, year, month);
  });

  const leaveRequests = await scanTable(LEAVE_TABLE);

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
      paidLeaves: 0,
      totalCompOffLeaveTaken: 0,
      weekOffDays: 0,
      totalPayableDays: 0,
      numOfWorkOnWeekendDays: 0,
      LWP: 0,
      cycle1: {
        totalHours: 0,
        totalWorkingDays: 0,
        paidLeaves: 0,
        totalCompOffLeaveTaken: 0,
        weekOffDays: 0,
        numOfWorkOnWeekendDays: 0,
        totalPayableDays: 0,
        LWP: 0
      },
      cycle2: {
        totalHours: 0,
        totalWorkingDays: 0,
        paidLeaves: 0,
        totalCompOffLeaveTaken: 0,
        weekOffDays: 0,
        numOfWorkOnWeekendDays: 0,
        totalPayableDays: 0,
        LWP: 0
      }
    };

    const uniqueDates = new Set();
    const weekendWorkDates = new Set();
    const dateLogsMap = {};

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
        // LWP addition for blank working days
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const leaveDatesSet = new Set();
    

    // Group logs by date
    for (const log of empLogs) {
      const entryDate = new Date(log.entryDate);
      const dateStr = entryDate.toISOString().split('T')[0];
      if (!dateLogsMap[dateStr]) dateLogsMap[dateStr] = [];
      dateLogsMap[dateStr].push(log);
    }

    // Iterate per unique day
    for (const dateStr of Object.keys(dateLogsMap)) {
      const logsForDay = dateLogsMap[dateStr];
      const entryDate = new Date(dateStr);
      const week = Math.min(getWeekOfMonth(entryDate), 5);
      const weekKey = `Week ${week}`;
      const cycle = getCycle(entryDate);

      const totalDayHours = logsForDay.reduce((sum, log) => sum + parseFloat(log.totalHoursSpent || 0), 0);

      // Add to weekly & cycle hour buckets regardless of whether day counted or not
      weekData[weekKey] += totalDayHours;
      weekData.totalHours += totalDayHours;
      weekData[cycle].totalHours += totalDayHours;

      // if (totalDayHours < 2) {
      //   weekData.LWP += 1;
      //   weekData[cycle].LWP += 1;
      // } else 
      if (totalDayHours <= 5) {
        weekData.totalWorkingDays += 0.5;
        weekData[cycle].totalWorkingDays += 0.5;
        uniqueDates.add(dateStr);
        if (isWeekOff(entryDate)) {
          weekendWorkDates.add(dateStr);
          weekData[cycle].numOfWorkOnWeekendDays += 1;
        }
      } else {
        weekData.totalWorkingDays += 1;
        weekData[cycle].totalWorkingDays += 1;
        uniqueDates.add(dateStr);
        if (isWeekOff(entryDate)) {
          weekendWorkDates.add(dateStr);
          weekData[cycle].numOfWorkOnWeekendDays += 1;
        }
      }
    }

    // Count week off days
    for (let d = 1; d <= new Date(year, month + 1, 0).getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split('T')[0];
      const cycle = getCycle(date);

      if (isWeekOff(date) && !weekendWorkDates.has(dateStr)) {
        weekData.weekOffDays++;
        weekData[cycle].weekOffDays += 1;
      }
    }

    // Add Paid/Comp Off Leaves
    for (const leave of leaveRequests) {
      if (leave.userEmail !== emp.email || leave.status === 'rejected') continue;
      const isComp = leave.leaveType.toLowerCase().includes('compensatory leave');
      const isHalf = leave.durationType === 'Half Day';
      let start = new Date(leave.startDate);
      const end = new Date(leave.endDate);

      while (start <= end) {
        if (isSameMonth(start, year, month)) {
          const cycle = getCycle(start);
          const amount = isHalf ? 0.5 : 1;
          if (isComp) {
            weekData[cycle].totalCompOffLeaveTaken += amount;
          } 
          else if (leave.leaveType !== 'LWP') {
            weekData[cycle].paidLeaves += amount;
          }
        }
        start.setDate(start.getDate() + 1);
      }
    }

    // ✅ Add Holiday Payable Days
    for (const holiday of HOLIDAY_DATES) {
      if (holiday.month !== month) continue;
      const holidayDate = new Date(year, month, holiday.date);
      const dateStr = holidayDate.toISOString().split('T')[0];
      const cycle = getCycle(holidayDate);

      const isHolidayWeekend = isWeekOff(holidayDate);
      const hasLog = Object.keys(dateLogsMap).includes(dateStr);

      if (!isHolidayWeekend && !hasLog) {
        weekData[cycle].totalPayableDays += 1;
      }
    }

    // Combine payable days
    weekData.paidLeaves = weekData.cycle1.paidLeaves + weekData.cycle2.paidLeaves;
    weekData.totalCompOffLeaveTaken =
      weekData.cycle1.totalCompOffLeaveTaken + weekData.cycle2.totalCompOffLeaveTaken;

    for (const cycle of ['cycle1', 'cycle2']) {
      const c = weekData[cycle];
      c.totalPayableDays +=
        c.totalWorkingDays +
        c.weekOffDays +
        c.totalCompOffLeaveTaken +
        c.paidLeaves -
        c.numOfWorkOnWeekendDays;
    }

    weekData.totalPayableDays =
      weekData.cycle1.totalPayableDays + weekData.cycle2.totalPayableDays;











      const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

      weekData.LWP = totalDaysInMonth - (weekData.paidLeaves + weekData.totalPayableDays);
  
      const cycle1Days = 25;
      const cycle2Days = totalDaysInMonth - 25;
  
      weekData.cycle1.LWP =
        cycle1Days -
        (weekData.cycle1.paidLeaves + weekData.cycle1.totalPayableDays);
  
      weekData.cycle2.LWP =
        cycle2Days -
        (weekData.cycle2.paidLeaves + weekData.cycle2.totalPayableDays);
  
















    result.push(weekData);
  }

  return result;
}



if (process.argv[1] === new URL(import.meta.url).pathname) {
  const inputYear = parseInt(process.argv[2], 10);
  const inputMonth = parseInt(process.argv[3], 10);

  const today = new Date();
  // const year = !isNaN(inputYear) ? inputYear : today.getFullYear();
  // const month = !isNaN(inputMonth) ? inputMonth : today.getMonth();

  const month = queryParams.month !== undefined ? Number(queryParams.month) : new Date().getMonth();
  const year = queryParams.year !== undefined ? Number(queryParams.year) : new Date().getFullYear();

  calculateHours(year, month).then(data =>
    console.log(JSON.stringify(data, null, 2))
  );
}

async function getUserRolesByEmail(email) {
  const params = {
    TableName: 'hrmsAccessControler',
    IndexName: 'email-role-index',
    KeyConditionExpression: '#email = :email',
    ExpressionAttributeNames: {
      '#email': 'email'
    },
    ExpressionAttributeValues: {
      ':email': email
    }
  };

  try {
    const data = await docClient.query(params).promise();
    // console.log(data,'31888888888888888888888888888888888888888888')
    return data.Items.map(item => item.role);
  } catch (error) {
    console.error(`Error fetching roles for ${email}:`, error);
    return [];
  }
}

export const handler = async (event) => {
  const queryParams = event.queryStringParameters || {};

  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  const authUserEmail = await verifyGoogleToken(authHeader);
  console.log("Verified user email:", authUserEmail);
  if (authUserEmail === "invalid token") {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }
  const userRoles = await getUserRolesByEmail(authUserEmail); // knowing the role of

  const month = queryParams.month !== undefined ? Number(queryParams.month) : new Date().getMonth();
  const year = queryParams.year !== undefined ? Number(queryParams.year) : new Date().getFullYear();

  let emailFilter = queryParams.email;
  const limit = parseInt(queryParams.limit);
  const page = parseInt(queryParams.page) || 1;
  if(!(userRoles.includes('admin')) && !(userRoles.includes('superAdmin'))){
    emailFilter=queryParams.email || authUserEmail;
  }

  let data = await calculateHours(year, month);

  // Filter by email if provided
  if (emailFilter) {
    data = data.filter(item => item.email === emailFilter);
  }

  const totalItems = data.length;
  let paginatedData = data;

  // Apply pagination if limit is specified
  if (!isNaN(limit)) {
    const startIndex = (page - 1) * limit;
    paginatedData = data.slice(startIndex, startIndex + limit);
  }

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*', // Or specify your frontend domain instead of '*'
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
    },
    body: JSON.stringify({
      success: true,
      totalItems,
      currentPage: page,
      totalPages: limit ? Math.ceil(totalItems / limit) : 1,
      data: paginatedData,
    }),
  };
};

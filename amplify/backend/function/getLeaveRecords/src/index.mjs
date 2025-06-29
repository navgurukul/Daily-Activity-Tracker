
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import https from "https";

const client = new DynamoDBClient({ region: "ap-south-1" });
const docClient = DynamoDBDocumentClient.from(client);

const fetchSheetData = () => {
  const url =
    "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=pncdata";

  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.success) {
              resolve(parsed.data);
            } else {
              reject("Invalid response from external API");
            }
          } catch (err) {
            reject(err);
          }
        });
      })
      .on("error", (err) => reject(err));
  });
};

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS,GET",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  };

  try {
    // 1. Fetch employee list from external sheet
    const query = event.queryStringParameters || {};

    const externalData = await fetchSheetData();
    const teamIdToEmployee = {};
    externalData.forEach((emp) => {
      const email = emp["Team ID"];
      if (email) {
        teamIdToEmployee[email] = emp;
      }
    });

    const employeeEmail = event.queryStringParameters?.employeeEmail;
    const leave_status = event.queryStringParameters?.status;
    const LeaveType = event.queryStringParameters?.leaveType;
    const month = Number(event.queryStringParameters?.month);
    console.log("-------------------------------");
    let monthArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    let statuses_array = ["approved", "pending", "rejected"]
    let LeaveTypeArray = [
      "Exam Leave",
      "Casual Leave",
      "Bereavement Leave",
      "Vipassana Leave",
      "Wellness Leave",
      "SRS Leave",
      "Maternity Leave",
      "Parental Leave",
      "Miscarriage Leave",
      "Festival Leave",
      "Wedding Leave",
      "Compensatory Leave"
    ];
    console.log("1111111111111111111111",monthArray);
    if(LeaveType != null || LeaveType != undefined){
      LeaveTypeArray = [LeaveType]
    }
    if(month){
      monthArray = [month]
    }
    console.log("2222222222222222222222222222",monthArray);
    if (leave_status != null || leave_status != undefined) {
      statuses_array = [leave_status]
    }
    let emailsToReturn;
    if (employeeEmail) {
      if (teamIdToEmployee[employeeEmail]) {
        emailsToReturn = [employeeEmail];
      } else {
        // Email not found in sheet — return empty
        return {
          statusCode: 200,
          body: JSON.stringify({}),
          headers,
        };
      }
    } else {
      emailsToReturn = Object.keys(teamIdToEmployee);
    }

    // 2. Fetch all leave requests from DynamoDB
    const scanParams = {
      TableName: "hrmsLeaveRequests",
    };
    const scanResult = await docClient.send(new ScanCommand(scanParams));
    const allLeaveItems = scanResult.Items || [];

    // 3. Group leave data by user
    const groupedLeaves = {};
    allLeaveItems.forEach((item) => {
      const email = item.userEmail;
      if (!groupedLeaves[email]) {
        groupedLeaves[email] = {
          approved: [],
          pending: [],
          rejected: [],
        };
      }

      const sortDate = item.approvalDate || item.startDate || item.endDate;
      console.log('iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii',item);
      const record = {
        Id: item.Id,
        leaveType: item.leaveType,
        status: item.status,
        approvalDate: item.approvalDate,
        approvalEmail: item.approverEmail,
        startDate: item.startDate,
        endDate: item.endDate,
        leaveDuration: item.leaveDuration,
        durationType: item.durationType,
        reasonForLeave: item.reasonForLeave,
        halfDayStatus: item.halfDayStatus || "",
        sortDate,
      };
      
      const start_Date = new Date(item.startDate);
      const monthNumber = start_Date.getMonth() + 1;

      console.log("MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM",monthArray,monthNumber);

      if (item.status === "approved") {
        if (statuses_array.includes(item.status)) {
          if (LeaveTypeArray.includes(item.leaveType)) {
            if(monthArray.includes(monthNumber)){
              groupedLeaves[email].approved.push(record);
            }
          }
        }
      } else if (item.status === "pending") {
        if (statuses_array.includes(item.status)) {
          if (LeaveTypeArray.includes(item.leaveType)) {
            if(monthArray.includes(monthNumber)){
              groupedLeaves[email].pending.push(record); 
            }
          }
        }
      } else if (item.status === "rejected") {
        if (statuses_array.includes(item.status)) {
          if (LeaveTypeArray.includes(item.leaveType)) {
            if(monthArray.includes(monthNumber)){
              groupedLeaves[email].rejected.push(record);
            }
          }
        }
      }
    });

    // 4. Create final response for requested employees
    const response = {};
    emailsToReturn.forEach((email) => {
      const leaves = groupedLeaves[email] || {
        approved: [],
        pending: [],
        rejected: [],
      };

      // if(leves[email])
      // console.log("PPPPPPPPPPPPPPPPPPPPPPP",leaves[email]);
      
      const sortByDate = (a, b) =>
        new Date(b.sortDate) - new Date(a.sortDate);

      statuses_array.forEach((status) => {
        leaves[status].sort(sortByDate);
        leaves[status] = leaves[status].map(({ sortDate, ...rest }) => rest);
      });
      // const approved_length =  
      if(leaves['approved'].length > 0 || leaves["pending"].length > 0 || leaves["rejected"].length > 0){
        response[email] = leaves;
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify(response),
      headers,
    };
  } catch (err) {
    console.error("Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Server Error" }),
      headers,
    };
  }
};

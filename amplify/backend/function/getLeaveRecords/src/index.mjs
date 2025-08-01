// import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
// import {
//   DynamoDBDocumentClient,
//   ScanCommand,
// } from "@aws-sdk/lib-dynamodb";
// import https from "https";

// const client = new DynamoDBClient({ region: "ap-south-1" });
// const docClient = DynamoDBDocumentClient.from(client);

// const fetchSheetData = () => {
//   const url =
//     "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=pncdata";

//   return new Promise((resolve, reject) => {
//     https
//       .get(url, (res) => {
//         let data = "";
//         res.on("data", (chunk) => (data += chunk));
//         res.on("end", () => {
//           try {
//             const parsed = JSON.parse(data);
//             if (parsed.success) {
//               resolve(parsed.data);
//             } else {
//               reject("Invalid response from external API");
//             }
//           } catch (err) {
//             reject(err);
//           }
//         });
//       })
//       .on("error", (err) => reject(err));
//   });
// };

// export const handler = async (event) => {
//   const headers = {
//     "Access-Control-Allow-Origin": "*",
//     "Access-Control-Allow-Methods": "OPTIONS,GET",
//     "Access-Control-Allow-Headers": "Content-Type,Authorization",
//   };

//   try {
//     const query = event.queryStringParameters || {};
//     const {
//       employeeEmail,
//       status,
//       page = 1,
//       limit,
//       from,
//       to,
//       leaveType,
//       durationType,
//       minDuration,
//       approverEmail,
//     } = query;

//     let limit_item = Number(query.limit) || 10;
//     let page_no = Number(query.page_no) || 1;
//     console.log("YYYYYYYYYYYYYY",typeof limit_item,typeof page_no);

//     const numericPage = parseInt(page) || 1;
//     const numericLimit = limit ? parseInt(limit) : null;
//     const minDays = minDuration ? parseInt(minDuration) : null;

//     // 1. Fetch employee list from external sheet
//     const externalData = await fetchSheetData();
//     const teamIdToEmployee = {};
//     externalData.forEach((emp) => {
//       const email = emp["Team ID"];
//       if (email) {
//         teamIdToEmployee[email] = emp;
//       }
//     });

//     let emailsToReturn;
//     if (employeeEmail) {
//       if (teamIdToEmployee[employeeEmail]) {
//         emailsToReturn = [employeeEmail];
//       } else {
//         return {
//           statusCode: 200,
//           body: JSON.stringify({}),
//           headers,
//         };
//       }
//     } else {
//       emailsToReturn = Object.keys(teamIdToEmployee);
//     }

//     // 2. Fetch all leave requests from DynamoDB
//     const scanParams = {
//       TableName: "hrmsLeaveRequests",
//     };
//     const scanResult = await docClient.send(new ScanCommand(scanParams));
//     const allLeaveItems = scanResult.Items || [];

//     // 3. Group leave data by user
//     const groupedLeaves = {};
//     allLeaveItems.forEach((item) => {
//       const email = item.userEmail;
//       if (!emailsToReturn.includes(email)) return;

//       if (!groupedLeaves[email]) {
//         groupedLeaves[email] = {
//           approved: [],
//           pending: [],
//           rejected: [],
//         };
//       }

//       const sortDate = item.approvalDate || item.startDate || item.endDate;
//       const record = {
//         Id: item.Id,
//         leaveType: item.leaveType,
//         status: item.status,
//         approvalDate: item.approvalDate,
//         approvalEmail: item.approverEmail,
//         startDate: item.startDate,
//         endDate: item.endDate,
//         leaveDuration: item.leaveDuration,
//         durationType: item.durationType,
//         reasonForLeave: item.reasonForLeave,
//         halfDayStatus: item.halfDayStatus || "",
//         sortDate,
//       };

//       groupedLeaves[email][item.status]?.push(record);
//     });

//     // 4. Filter and paginate
//     const filterBy = (list) =>
//       list.filter((item) => {
//         const itemStart = new Date(item.startDate);
//         const itemEnd = new Date(item.endDate);

//         // Handle date overlap
//         if (from && itemEnd < new Date(from)) return false;
//         if (to && itemStart > new Date(to)) return false;

//         if (leaveType && item.leaveType !== leaveType) return false;
//         if (durationType && item.durationType !== durationType) return false;
//         if (minDays && item.leaveDuration < minDays) return false;
//         if (approverEmail && item.approvalEmail !== approverEmail) return false;
//         return true;
//       });

//     const sortByDate = (a, b) => new Date(b.sortDate) - new Date(a.sortDate);

//     const response = {};
//     for (const email of emailsToReturn) {
//       const leaves = groupedLeaves[email] || {
//         approved: [],
//         pending: [],
//         rejected: [],
//       };

//       const final = {};
//       const statuses = status
//         ? [status]
//         : ["approved", "pending", "rejected"];

//       for (const stat of statuses) {
//         const filtered = filterBy(leaves[stat] || []);
//         const sorted = filtered.sort(sortByDate);
//         const paginated = numericLimit
//           ? sorted.slice((numericPage - 1) * numericLimit, numericPage * numericLimit)
//           : sorted;
//         final[stat] = paginated.map(({ sortDate, ...rest }) => rest);
//       }

//       response[email] = final;
//     }



//     //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

//     // Step 1: Filter only those with non-empty `pending`
//     console.log("MMMMMMMMMMMMMMMMMMMMMMMMMMMMM",response);
//     const filteredFinal = {};
//     for (const [email, data] of Object.entries(response)) {
//       if (data.pending && data.pending.length > 0) {
//         filteredFinal[email] = data;
//       }
//     }

//     // Step 2: Get keys after filtering
//     console.log(filteredFinal);
//     const emailKeys = Object.keys(filteredFinal);
//     console.log("1111111111111111111111111111",emailKeys);
//     // ✅ Use filtered count for pagination
//     const totalItems = emailKeys.length;
//     // const limit = Number(req.query.limit) || 10;
//     // const page = Number(req.query.page) || 1;
//     const totalPages = Math.ceil(totalItems / limit_item);

//     // Check for valid page
//     // console.log("============================",page,totalPages);
//     // if (page > totalPages || totalPages === 0) {
//     //   // return res.json({
//     //   //   currentPage: page,
//     //   //   nextPage: null,
//     //   //   totalPages,
//     //   //   data: {}
//     //   // });
//     //   return {
//     //     statusCode: 200,
//     //     body: JSON.stringify({
//     //       currentPage: page,
//     //       nextPage: null,
//     //       totalPages,
//     //       data: {}
//     //     }),
//     //     headers,
//     //   };
//     // }

//     // Step 3: Slice and return paginated data
//     const start = (Number(page_no) - 1) * Number(limit_item);

//     const end = Number(start) + Number(limit_item);
//     console.log();
//     const paginatedKeys = emailKeys.slice(start, end);
//     console.log("EEEEEEEEEEEEEEEE",emailKeys,start,end);
//     console.log("PPPPPPPPPPPP",paginatedKeys);

//     const paginatedData = {};
//     paginatedKeys.forEach(key => {
//       paginatedData[key] = filteredFinal[key];
//     });

//     return {
//       statusCode: 200,
//       body: JSON.stringify({
//         currentPage: page_no,
//         nextPage: page_no < totalPages ? page_no + 1 : null,
//         totalPages,
//         data: paginatedData
//       }),
//       headers,
//     };
//   } catch (err) {
//     console.error("Error:", err);
//     return {
//       statusCode: 500,
//       body: JSON.stringify({ error: err.message || "Server Error" }),
//       headers,
//     };
//   }
// };













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

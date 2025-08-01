import React, { useState, useEffect } from "react";

const AddProjectModal = ({ isOpen, onClose, onSubmit, departments }) => {
  const [data, setData] = useState({
    department: "",
    projectName: "",
    channelId: "",
    projectMasterEmail: "",
    projectBudget: "",
    discordWebhook: "",
  });

  const [errors, setErrors] = useState({});
  const [showTooltip, setShowTooltip] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setData({
        department: "",
        projectName: "",
        channelId: "",
        projectMasterEmail: "",
        projectBudget: "",
        discordWebhook: "",
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleSubmit = () => {
    const newErrors = {};
    
    // Validation for the 4 required fields only
    if (!data.department) {
      newErrors.department = "Please select a department*";
    }
    if (!data.projectName) {
      newErrors.projectName = "Please fill in the project name*";
    }
    if (!data.projectMasterEmail) {
      newErrors.projectMasterEmail = "Please fill in the project master email*";
    }
    if (!data.projectBudget) {
      newErrors.projectBudget = "Please fill in the project budget*";
    } else if (isNaN(data.projectBudget) || Number(data.projectBudget) < 0) {
      newErrors.projectBudget = "Please enter a valid project budget*";
    }

    // Removed validation for channelId and discordWebhook as they are now optional

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    
    // Add projectStatus: "Active" to the submitted data
    const submissionData = {
      ...data,
      projectStatus: "Active"
    };
    
    onSubmit(submissionData);
  };

  const handleCancel = () => {
    setData({
      department: "",
      projectName: "",
      channelId: "",
      projectMasterEmail: "",
      projectBudget: "",
      discordWebhook: "",
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-white" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-white">
          <h2>Add New Project</h2>
          <button className="close-btn-white" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="modal-body-white">
          <div className="form-fields-white">
            {/* Row 1: Department & Project Name */}
            <div className="input-wrapper-white">
              <label className="field-label">Department *</label>
              <select
                className={`input-field-white ${errors.department ? 'error' : ''}`}
                value={data.department}
                onChange={(e) => setData({ ...data, department: e.target.value })}
              >
                <option value="" disabled>
                  Select Department
                </option>
                {departments.map((dept, idx) => (
                  <option key={idx} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              {errors.department && <div className="error-message">{errors.department}</div>}
            </div>

            <div className="input-wrapper-white">
              <label className="field-label">Project Name *</label>
              <input
                type="text"
                placeholder="Enter project name"
                className={`input-field-white ${errors.projectName ? 'error' : ''}`}
                value={data.projectName}
                onChange={(e) => setData({ ...data, projectName: e.target.value })}
              />
              {errors.projectName && <div className="error-message">{errors.projectName}</div>}
            </div>

            {/* Row 2: Slack Channel ID & PM Email */}
            <div className="input-wrapper-white">
              <label className="field-label">Slack Channel ID (Optional)</label>
              <input
                type="text"
                placeholder="C1234567890"
                className="input-field-white"
                value={data.channelId}
                onChange={(e) => setData({ ...data, channelId: e.target.value })}
              />
            </div>

            <div className="input-wrapper-white">
              <label className="field-label">PM Email *</label>
              <input
                type="email"
                placeholder="manager@company.com"
                className={`input-field-white ${errors.projectMasterEmail ? 'error' : ''}`}
                value={data.projectMasterEmail}
                onChange={(e) => setData({ ...data, projectMasterEmail: e.target.value })}
              />
              {errors.projectMasterEmail && <div className="error-message">{errors.projectMasterEmail}</div>}
            </div>

            {/* Row 3: Project Budget */}
            <div className="input-wrapper-white">
              <label className="field-label">Project Budget *</label>
              <input
                type="number"
                placeholder="Enter budget amount"
                className={`input-field-white ${errors.projectBudget ? 'error' : ''}`}
                value={data.projectBudget}
                onChange={(e) => setData({ ...data, projectBudget: e.target.value })}
              />
              {errors.projectBudget && <div className="error-message">{errors.projectBudget}</div>}
            </div>

            <div className="input-wrapper-white">
              {/* Empty space for alignment */}
            </div>

            {/* Row 4: Discord Webhook - Full Width */}
            <div className="input-wrapper-white full-width">
              <label className="field-label">Discord Channel Web Hook URL (Optional)</label>
              <div className="tooltip-container">
                <input
                  type="text"
                  placeholder="https://discord.com/api/webhooks/..."
                  className="input-field-white"
                  value={data.discordWebhook}
                  onChange={(e) => setData({ ...data, discordWebhook: e.target.value })}
                  onFocus={() => setShowTooltip(true)}
                  onBlur={() => setShowTooltip(false)}
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                />
                {showTooltip && (
                  <div className="custom-tooltip">
                    Get your Discord Channel Web Hook URL from your Discord channel settings
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer-white">
          <button 
            className="cancel-btn-white" 
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button 
            className="create-btn-white" 
            onClick={handleSubmit}
          >
            Add Project
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProjectModal;
import { api, LightningElement, track, wire } from "lwc";

import { ShowToastEvent } from "lightning/platformShowToastEvent";
import search from "@salesforce/apex/UpdateProductOnWorkOrderCtrl.search";
import getWorkOrder from "@salesforce/apex/UpdateProductOnWorkOrderCtrl.getWorkOrder";
import saveWorkOrder from "@salesforce/apex/UpdateProductOnWorkOrderCtrl.saveWorkOrder";
import getSymptomCode from "@salesforce/apex/UpdateProductOnWorkOrderCtrl.getSymptomCode";
import getModelNumber from "@salesforce/apex/UpdateProductOnWorkOrderCtrl.getModelNumber";
import getProductSubGroup from "@salesforce/apex/UpdateProductOnWorkOrderCtrl.getProductSubGroup";
import disableProductChangeEditBtn from "@salesforce/apex/UpdateProductOnWorkOrderCtrl.disableProductChangeEditBtn";


import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';

import WorkOrder_OBJECT from '@salesforce/schema/WorkOrder';
import JOB_CLASSIFICATION_FIELD from '@salesforce/schema/WorkOrder.Job_Classification__c';  //GET PICKLIST VALUE

import { getRecordNotifyChange } from "lightning/uiRecordApi";

export default class UpdateProductOnWorkOrder extends LightningElement {
    @wire(getObjectInfo, { objectApiName: WorkOrder_OBJECT })
    WorkOrder_objectInfo;
    @wire(getPicklistValues, { recordTypeId: '$WorkOrder_objectInfo.data.defaultRecordTypeId', fieldApiName: JOB_CLASSIFICATION_FIELD })
    JobClassification_PickList_Val;

    @api recordId;

    @track
    record = {};
    @track
    draftRecord = {};

    isLoading = true;
    isEditable = false;

    isDefectRepairEditable = false;
    async connectedCallback() {
        this.isLoading = true;
        try {
            await this.wait(2000);
            this.record = await getWorkOrder({ recordId: this.recordId });
            this.draftRecord = JSON.parse(JSON.stringify(this.record));
            this.disableProductChangeEditHelper();

            setTimeout(() => {
                this.isLoading = false;
                this.getJobClassificationOnComboHelper();
            }, 1500);
        } catch (error) {
            this.showToast("Error", error.body.message, "error");
        }
        this.isLoading = false;
    }

    getJobClassificationOnComboHelper(event) {
        setTimeout(() => {
            let arr = this.JobClassification_PickList_Val.data.values;
            if (arr.length > 0) {
                for (let i = 0; i < arr.length; i++) {
                    if (this.jobClassification != null && this.jobClassification == arr[i].label) {
                        this.jobClassificationValue = arr[i].value;
                        break;
                    }
                }
            }
        }, 2000);
    }

    enableDisableProductEditBtn = true;
    jobTypeIsOutdoor = true;
    disableProductChangeEditHelper = async (event) => {
        await disableProductChangeEditBtn({ recordId: this.recordId }).then(result => {
            if (result != null && result != undefined) {
                if (result == 'false') {
                    this.enableDisableProductEditBtn = false;
                } else if (result == 'outDoorASC') {
                    this.enableDisableProductEditBtn = true;
                    this.jobTypeIsOutdoor = false;

                } else {
                    this.enableDisableProductEditBtn = true;
                }
            }
        }).catch(error => {
            this.error = error;
        })
    }

    wait(time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }

    get defaultGroup() {
        return {
            id: this.draftRecord.Product_Group__c,
            title: this.draftProductGroup,
            sObjectType: "Product_Group_Master__c"
        }
    }

    get defaultSubGroup() {
        return {
            id: this.draftRecord.Product_Sub_Group__c,
            title: this.draftProductSubGroup,
            sObjectType: "Product_Sub_Group_Master__c"
        }
    }

    get defaultModel() {
        return {
            id: this.draftRecord.Model_Product__c,
            title: this.draftModelNumber,
            sObjectType: "Product2"
        }
    }

    get defaultSymptomCode() {
        return {
            id: this.draftRecord.Symptom_Code_Master__c,
            title: this.draftSymptomCode,
            sObjectType: "Symptom_Code_Master__c"
        }
    }

    //Added on 12-May
    get defaultDefectCode() {
        return {
            id: this.draftRecord.Defect_Code_lookup_Base__c,
            title: this.draftDefectCode,
            sObjectType: "Defect_Code_lookup_Base__c"
        }
    }
    get defaultRepairCode() {
        return {
            id: this.draftRecord.Repair_Code__c,
            title: this.draftRepairCode,
            sObjectType: "Repair_Code__c"
        }
    }


    get productGroup() {
        return this.record?.Product_Group__r?.Name;
    }

    get productSubGroup() {
        return this.record?.Product_Sub_Group__r?.Name;
    }

    get modelNumber() {
        return this.record?.Model_Product__r?.Name;
    }

    get symptomCode() {
        return this.record?.Symptom_Code_Master__r?.Name;
    }

    //added on 12-May-2021 by Vivek S
    get jobClassification() {
        return this.record?.Job_Classification__c;
    }
    get defectCode() {
        return this.record?.Defect_Code_lookup_Base__r?.Name;
    }
    get repairCode() {
        return this.record?.Repair_Code__r?.Name;
    }

    //------

    get draftProductGroup() {
        return this.draftRecord?.Product_Group__r?.Name;
    }

    get draftProductSubGroup() {
        return this.draftRecord?.Product_Sub_Group__r?.Name;
    }

    get draftModelNumber() {
        return this.draftRecord?.Model_Product__r?.Name;
    }

    get draftSymptomCode() {
        return this.draftRecord?.Symptom_Code_Master__r?.Name;
    }

    get draftDefectCode() {
        return this.draftRecord?.Defect_Code_lookup_Base__r?.Name;
    }
    get draftRepairCode() {
        return this.draftRecord?.Repair_Code__r?.Name;
    }



    edit() {
        this.isEditable = true;
        this.checkProductAndJobClassification();
    }

    cancel() {
        this.isEditable = false;
        this.reloadDataOnCancel();//to reload data after the cancel was click
    }


    async reloadDataOnCancel() {
        this.isLoading = true;
        this.record = await getWorkOrder({ recordId: this.recordId });
        this.draftRecord = JSON.parse(JSON.stringify(this.record));
        this.isLoading = false;
        this.isDefectRepairEditable = false;
    }

    async save() {
        const workOrder = {
            Id: this.draftRecord.Id,
            Product_Group__c: this.draftRecord.Product_Group__c,
            Product_Sub_Group__c: this.draftRecord.Product_Sub_Group__c,
            Model_Product__c: this.draftRecord.Model_Product__c,
            Symptom_Code_Master__c: this.draftRecord.Symptom_Code_Master__c,

            Defect_Code_lookup_Base__c: this.draftRecord.Defect_Code_lookup_Base__c,
            Repair_Code__c: this.draftRecord.Repair_Code__c,
            Job_Classification__c: this.jobClassificationValue
        };
        if (workOrder.Product_Group__c == null || workOrder.Product_Sub_Group__c == null || workOrder.Model_Product__c == null) {
            if (workOrder.Product_Group__c == null) {
                this.showToast("Info", "Product Group is Required!!", "info");
            } else if (workOrder.Product_Sub_Group__c == null) {
                this.showToast("Info", "Product Sub Group is Required!!", "info");
            } else if (workOrder.Model_Product__c == null) {
                this.showToast("Info", "Model is Required!!", "info");
            }

        } else {
            try {
                this.isLoading = true;
                await saveWorkOrder({ workOrder });
                this.record = JSON.parse(JSON.stringify(this.draftRecord));

                getRecordNotifyChange([{ recordId: this.recordId }]);
                this.showToast("Success", "WorkOrder Record Save Successfully", "success");
                this.connectedCallback();
                this.isEditable = false;
                this.isDefectRepairEditable = false;
            }
            catch (error) {
                if (error.body.message != undefined && error.body.message.includes('is locked')) {
                    this.showToast("Error", 'This record is locked.', "error");
                } else {
                    this.showToast("Error", error.body.message, "error");
                }
            }
            finally {
                this.isLoading = false;
            }
        }


    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    async handleSearch(event) {
        const lookupElement = event.target;
        const parentField = event.target.getAttribute("data-parent-field-name");
        const parentValue = event.target.getAttribute("data-parent-value");

        const parentField2 = event.target.getAttribute("data-parent2-field-name");
        const parentValue2 = event.target.getAttribute("data-parent2-value");

        const parentField3 = event.target.getAttribute("data-parent3-field-name");
        const parentValue3 = event.target.getAttribute("data-parent3-value");

        const condition = (parentField && parentValue && parentValue !== "undefined") ? `${parentField} = '${parentValue}'` : null;
        const condition2 = (parentField2 && parentValue2 && parentValue2 !== "undefined") ? `${parentField2} = '${parentValue2}'` : null;
        const condition3 = (parentField3 && parentValue3 && parentValue3 !== "undefined") ? `${parentField3} = '${parentValue3}'` : null;

        const options = await search({
            condition, condition2, condition3,
            keyword: event.detail.searchTerm,
            objectName: event.target.getAttribute("data-object-name")
        });
        lookupElement.setSearchResults(options);
    }

    handleGroupSelect(event) {
        this.draftRecord.Product_Group__c = event.detail.length ? event.detail[0].id : null;
        this.draftRecord.Product_Group__r = {
            Name: event.detail.length ? event.detail[0].title : null
        };

        this.draftRecord.Symptom_Code_Master__c = null;
        this.draftRecord.Product_Sub_Group__r = {};
        this.draftRecord.Model_Product__c = null;
        this.draftRecord.Model_Product__r = {};
        this.draftRecord.Defect_Code_lookup_Base__c = null;
        this.draftRecord.Defect_Code_lookup_Base__r = {};
        this.draftRecord.Repair_Code__c = null;
        this.draftRecord.Repair_Code__r = {};

        if (this.draftRecord.Product_Group__c) {
            this.isDefectRepairEditable = true;//added on 12-May
        } else {
            this.isDefectRepairEditable = false;
        }
        this.enableSymptomCodeHelper();
    }

    async handleSubGroupSelect(event) {
        this.draftRecord.Product_Sub_Group__c = event.detail.length ? event.detail[0].id : null;
        this.draftRecord.Product_Sub_Group__r = {
            Name: event.detail.length ? event.detail[0].title : null
        };

        if (!this.draftRecord.Product_Sub_Group__c) {
            if (this.jobTypeIsOutdoor == true) {
                this.draftRecord.Product_Group__c = null;
                this.draftRecord.Defect_Code_lookup_Base__c = null;
                this.draftRecord.Repair_Code__c = null;
                this.isDefectRepairEditable = false;
            }
            //added on 06-June
            this.draftRecord.Symptom_Code_Master__c = null;
            this.draftRecord.Symptom_Code_Master__r = {};
        }

        this.draftRecord.Model_Product__c = null;
        this.draftRecord.Model_Product__r = {};

        if (!this.draftRecord.Product_Group__c && this.draftRecord.Product_Sub_Group__c) {
            const subGroup = await getProductSubGroup({ recordId: this.draftRecord.Product_Sub_Group__c });
            this.draftRecord.Product_Group__c = subGroup?.Product_Group__c;
            this.draftRecord.Product_Group__r = {
                Name: subGroup.Product_Group__r?.Name
            };
            if (this.draftRecord.Product_Group__c) {
                this.isDefectRepairEditable = true;//added on 12-May
            }
        }
        this.enableSymptomCodeHelper();
    }

    async handleModelSelect(event) {
        this.draftRecord.Model_Product__c = event.detail.length ? event.detail[0].id : null;
        this.draftRecord.Model_Product__r = {
            Name: event.detail.length ? event.detail[0].title : null
        };

        if (!this.draftRecord.Model_Product__c) {
            if (this.jobTypeIsOutdoor == true) {
                this.draftRecord.Product_Group__c = null;
                this.draftRecord.Defect_Code_lookup_Base__c = null;
                this.draftRecord.Repair_Code__c = null;
                this.isDefectRepairEditable = false;
            }
            this.draftRecord.Product_Sub_Group__c = null;
            this.draftRecord.Symptom_Code_Master__c = null;
        }

        if (!this.draftRecord.Product_Sub_Group__c && this.draftRecord.Model_Product__c) {
            const modelNumber = await getModelNumber({ recordId: this.draftRecord.Model_Product__c });
            if (this.jobTypeIsOutdoor == false) {
                if (this.draftRecord.Product_Group__c != modelNumber.Product_Sub_Group__r?.Product_Group__c) {
                    this.draftRecord.Model_Product__c = null;
                    this.draftRecord.Model_Product__r = null;
                    this.showToast('warning', 'You cannot select the model of different group.', 'warning');
                } else {
                    this.modelSelectHelper(modelNumber);
                }
            } else {
                this.modelSelectHelper(modelNumber);
            }
        }
        this.enableSymptomCodeHelper();
    }

    modelSelectHelper(modelNumber) {
        this.draftRecord.Product_Sub_Group__c = modelNumber.Product_Sub_Group__c;
        this.draftRecord.Product_Sub_Group__r = {
            Name: modelNumber.Product_Sub_Group__r?.Name
        };

        this.draftRecord.Product_Group__c = modelNumber.Product_Sub_Group__r?.Product_Group__c;
        this.draftRecord.Product_Group__r = {
            Name: modelNumber.Product_Sub_Group__r?.Product_Group__r?.Name
        };

        if (this.draftRecord.Product_Group__c) {
            this.isDefectRepairEditable = true;//added on 12-May
        }
    }


    async handleSymptomCodeSelect(event) {
        this.draftRecord.Symptom_Code_Master__c = event.detail.length ? event.detail[0].id : null;
        this.draftRecord.Symptom_Code_Master__r = {
            Name: event.detail.length ? event.detail[0].title : null
        };

        if (!this.draftRecord.Product_Group__c && this.draftRecord.Symptom_Code_Master__c) {
            const symptomCode = await getSymptomCode({ recordId: this.draftRecord.Symptom_Code_Master__c });
            this.draftRecord.Product_Group__c = symptomCode.Product_Group_Master__c;
            this.draftRecord.Product_Group__r = {
                Name: symptomCode.Product_Group_Master__r?.Name
            };
        } if (!this.draftRecord.Symptom_Code_Master__c) {
            //if symptom code is removed
            this.draftRecord.Defect_Code_lookup_Base__c = null;
            this.draftRecord.Defect_Code_lookup_Base__r = {};
            this.draftRecord.Repair_Code__c = null;
            this.draftRecord.Repair_Code__r = {};

            this.record.Repair_Code__r = {};
            this.record.Defect_Code_lookup_Base__r = {};

        }
        this.checkProductAndJobClassification();
    }

    jobClassificationValue = '';
    handleJobClassificationChange(event) {
        this.jobClassificationValue = event.detail.value;
        this.draftRecord.Defect_Code_lookup_Base__c = null;
        this.draftRecord.Repair_Code__c = null;
    }

    handleDefectCodeSelect(event) {
        this.draftRecord.Defect_Code_lookup_Base__c = event.detail.length ? event.detail[0].id : null;
        this.draftRecord.Defect_Code_lookup_Base__r = {
            Name: event.detail.length ? event.detail[0].title : null
        };
    }

    handleRepairCodeSelect(event) {
        this.draftRecord.Repair_Code__c = event.detail.length ? event.detail[0].id : null;
        this.draftRecord.Repair_Code__r = {
            Name: event.detail.length ? event.detail[0].title : null
        };
    }

    enableSymptomCode = true;
    checkProductAndJobClassification() {
        if (this.draftRecord.Product_Group__c && this.jobClassification != null && this.draftRecord.Symptom_Code_Master__c != null) {
            this.isDefectRepairEditable = true;
        } else {
            this.isDefectRepairEditable = false;
        }

        this.enableSymptomCodeHelper();
    }

    enableSymptomCodeHelper() {
        if (this.jobClassification && this.draftRecord.Product_Group__c) {
            this.enableSymptomCode = false;
        } else {
            this.enableSymptomCode = true;
        }
    }
}
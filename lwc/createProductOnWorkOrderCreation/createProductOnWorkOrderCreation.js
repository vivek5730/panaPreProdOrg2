/*
LastModifiedBy :   Vivek S
LastModifiedOn :   05-June-2021 
*/
import { LightningElement, api, track, wire } from 'lwc';

import { ShowToastEvent } from "lightning/platformShowToastEvent";
import search from "@salesforce/apex/UpdateProductOnWorkOrderCtrl.search";

import getProductGroup from "@salesforce/apex/UpdateProductOnWorkOrderCtrl.getProductGroup";
import getSymptomCode from "@salesforce/apex/UpdateProductOnWorkOrderCtrl.getSymptomCode";
import getModelNumber from "@salesforce/apex/UpdateProductOnWorkOrderCtrl.getModelNumber";
import getProductSubGroup from "@salesforce/apex/UpdateProductOnWorkOrderCtrl.getProductSubGroup";

import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';

import WorkOrder_OBJECT from '@salesforce/schema/WorkOrder';
import JOB_CLASSIFICATION_FIELD from '@salesforce/schema/WorkOrder.Job_Classification__c';  //GET PICKLIST VALUE


export default class CreateProductOnWorkOrderCreation extends LightningElement {
    @wire(getObjectInfo, { objectApiName: WorkOrder_OBJECT })
    WorkOrder_objectInfo;
    @wire(getPicklistValues, { recordTypeId: '$WorkOrder_objectInfo.data.defaultRecordTypeId', fieldApiName: JOB_CLASSIFICATION_FIELD })
    JobClassification_PickList_Val;

    @track draftRecord = {};

    isLoading = false;
    isEditable = false;

    @api
    async setDefaultLookups(groupId, subGroupId, modelNumberId, symptomCodeId) {
        try {
            if (modelNumberId) {
                const modelNumber = await getModelNumber({ recordId: modelNumberId });
                this.draftRecord = {
                    Product_Group__c: groupId,
                    Product_Sub_Group__c: subGroupId,
                    Model_Product__c: modelNumberId,
                    Product_Group__r: {
                        Name: modelNumber?.Product_Sub_Group__r?.Product_Group__r?.Name
                    },
                    Product_Sub_Group__r: {
                        Name: modelNumber?.Product_Sub_Group__r?.Name
                    },
                    Model_Product__r: {
                        Name: modelNumber?.Name
                    }
                }
            }
            else if (subGroupId) {
                const subGroup = await getProductSubGroup({ recordId: subGroupId });
                this.draftRecord = {
                    Product_Group__c: groupId,
                    Product_Sub_Group__c: subGroupId,
                    Product_Group__r: {
                        Name: subGroup.Product_Group__r?.Name
                    },
                    Product_Sub_Group__r: {
                        Name: subGroup?.Name
                    }
                }
            }
            else if (symptomCodeId) {
                const symptomCode = await getSymptomCode({ recordId: symptomCodeId });
                this.draftRecord = {
                    Product_Group__c: symptomCode?.Product_Group_Master__c,
                    Symptom_Code_Master__c: symptomCodeId,
                    Product_Group__r: {
                        Name: symptomCode?.Product_Group_Master__r.Name
                    },
                    Symptom_Code_Master__r: {
                        Name: symptomCode?.Name
                    }
                }
            }
            else if (groupId) {
                const group = await getProductGroup({ recordId: groupId });
                this.draftRecord = {
                    Product_Group__c: groupId,
                    Product_Group__r: {
                        Name: group?.Name
                    },
                }
            }
        }
        catch (error) {
            this.showToast("Error", error.body.message, "error");
        }

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

    close() {
        window.location.reload();
        this.dispatchEvent(new CustomEvent("closeWorkOrder"));
    }

    async save() {
        if (!this.draftRecord.Product_Group__c || !this.draftRecord.Product_Sub_Group__c) {
            this.showToast("Error", "Please select product group and sub groups");
            return;
        }
        if (!this.draftRecord.Job_Classification__c) {
            this.showToast("Error", "Please select Job Classification", "warning");
            return;
        }




        this.dispatchEvent(new CustomEvent("workOrderUpdate", {
            detail: {
                Product_Group__c: this.draftRecord.Product_Group__c,
                Product_Sub_Group__c: this.draftRecord.Product_Sub_Group__c,
                Model_Product__c: this.draftRecord.Model_Product__c,
                Symptom_Code_Master__c: this.draftRecord.Symptom_Code_Master__c,
                Job_Classification__c: this.draftRecord.Job_Classification__c
            }
        }));
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

        const condition = (parentField && parentValue && parentValue !== "undefined") ? `${parentField} = '${parentValue}'` : null;
        const condition2 = (parentField2 && parentValue2 && parentValue2 !== "undefined") ? `${parentField2} = '${parentValue2}'` : null;

        const options = await search({
            condition, condition2,
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

        //disable symptom code
        if (this.draftRecord.Job_Classification__c && this.draftRecord.Product_Group__c) {
            this.enableSymptomCode = false;
        } else {
            this.enableSymptomCode = true;
        }
    }

    async handleSubGroupSelect(event) {
        this.draftRecord.Product_Sub_Group__c = event.detail.length ? event.detail[0].id : null;
        this.draftRecord.Product_Sub_Group__r = {
            Name: event.detail.length ? event.detail[0].title : null
        };

        if (!this.draftRecord.Product_Sub_Group__c) {
            this.draftRecord.Product_Group__c = null;
        }

        this.draftRecord.Model_Product__c = null;
        this.draftRecord.Model_Product__r = {};

        if (!this.draftRecord.Product_Group__c && this.draftRecord.Product_Sub_Group__c) {
            const subGroup = await getProductSubGroup({ recordId: this.draftRecord.Product_Sub_Group__c });
            this.draftRecord.Product_Group__c = subGroup?.Product_Group__c;
            this.draftRecord.Product_Group__r = {
                Name: subGroup.Product_Group__r?.Name
            };
        }

        //disable symptom code
        if (this.draftRecord.Job_Classification__c && this.draftRecord.Product_Group__c) {
            this.enableSymptomCode = false;
        } else {
            this.enableSymptomCode = true;
        }
    }

    async handleModelSelect(event) {
        this.draftRecord.Model_Product__c = event.detail.length ? event.detail[0].id : null;
        this.draftRecord.Model_Product__r = {
            Name: event.detail.length ? event.detail[0].title : null
        };

        if (!this.draftRecord.Model_Product__c) {
            this.draftRecord.Product_Group__c = null;
            this.draftRecord.Product_Sub_Group__c = null;
            this.draftRecord.Symptom_Code_Master__c = null;
        }

        if (!this.draftRecord.Product_Sub_Group__c && this.draftRecord.Model_Product__c) {
            const modelNumber = await getModelNumber({ recordId: this.draftRecord.Model_Product__c });
            this.draftRecord.Product_Sub_Group__c = modelNumber.Product_Sub_Group__c;
            this.draftRecord.Product_Sub_Group__r = {
                Name: modelNumber.Product_Sub_Group__r?.Name
            };

            this.draftRecord.Product_Group__c = modelNumber.Product_Sub_Group__r?.Product_Group__c;
            this.draftRecord.Product_Group__r = {
                Name: modelNumber.Product_Sub_Group__r?.Product_Group__r?.Name
            };
        }

        //disable symptom code
        if (this.draftRecord.Job_Classification__c && this.draftRecord.Product_Group__c) {
            this.enableSymptomCode = false;
        } else {
            this.enableSymptomCode = true;
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
        }
    }

    //jobClassificationValue = '';
    enableSymptomCode = true;
    handleJobClassificationChange(event) {
        this.draftRecord.Job_Classification__c = event.detail.value;
        if (this.draftRecord.Job_Classification__c && this.draftRecord.Product_Group__c) {
            this.enableSymptomCode = false;
        } else {
            this.enableSymptomCode = true;
        }
    }
}
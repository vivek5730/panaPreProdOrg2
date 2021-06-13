/*
CreatedDate : 10-May-2021
CreatedBy   : Vivek S
LastModifiedOn  :   02-June-2021
*/

import { LightningElement, track, wire, api } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import search from "@salesforce/apex/PI_AddressPopulateHelper.search";
import getCityInfo from "@salesforce/apex/PI_AddressPopulateHelper.getCityInfo";
import getAreaInfo from "@salesforce/apex/PI_AddressPopulateHelper.getAreaInfo";
import returnAreaAndPincode from '@salesforce/apex/PI_AddressPopulateHelper.returnAreaAndPincode';
import updatesObjectAddress from '@salesforce/apex/PI_AddressPopulateHelper.updatesObjectAddress';

import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';

import address_OBJECT from '@salesforce/schema/Address';
import address_address_Type_FIELD from '@salesforce/schema/Address.AddressType';  //GET PICKLIST VALUE

export default class Pi_AddAddress_LWC extends LightningElement {

    @wire(getObjectInfo, { objectApiName: address_OBJECT })
    address_objectInfo;
    @wire(getPicklistValues, { recordTypeId: '$address_objectInfo.data.defaultRecordTypeId', fieldApiName: address_address_Type_FIELD })
    address_Type_PickList_Val;

    @track draftRecord = {};
    @api recordId;
    @api objectApiName;
    @api recId;

    isLoading = false;
    isEditable = false;
    defaultCountryValue = 'India';
    addressTypeValue = '';

    connectedCallback() {
        this.isLoading = true;
        setTimeout(() => {
            this.isLoading = false;
        }, 2000);
    }

    get defaultState() {
        return {
            id: this.draftRecord.State_Master__c,
            title: this.draftStateGroup,
            sObjectType: "State_Master__c"
        }
    }
    get draftStateGroup() {
        return this.draftRecord?.State_Master__r?.Name;
    }

    get defaultCity() {
        return {
            id: this.draftRecord.City_Master__c,
            title: this.draftCityGroup,
            sObjectType: "City_Master__c"
        }
    }
    get draftCityGroup() {
        return this.draftRecord?.City_Master__r?.Name;
    }

    get defaultArea() {
        return {
            id: this.draftRecord.Area_Master__c,
            title: this.draftAreaGroup,
            sObjectType: "Area_Master__c"
        }
    }
    get draftAreaGroup() {
        return this.draftRecord?.Area_Master__r?.Name;
    }

    async handleSearch(event) {
        const lookupElement = event.target;
        const parentField = event.target.getAttribute("data-parent-field-name");
        const parentValue = event.target.getAttribute("data-parent-value");
        const condition = (parentField && parentValue && parentValue !== "undefined") ? `${parentField} = '${parentValue}'` : null;
        const options = await search({
            condition,
            keyword: event.detail.searchTerm,
            objectName: event.target.getAttribute("data-object-name")
        });
        lookupElement.setSearchResults(options);
    }

    handleStateSelect(event) {
        this.draftRecord.State_Master__c = event.detail.length ? event.detail[0].id : null;
        this.draftRecord.State_Master__r = {
            Name: event.detail.length ? event.detail[0].title : null
        };
        this.postalCode = '';
        this.draftRecord.Postal_Master__c = null;
    }
    async handleCitySelect(event) {
        this.draftRecord.City_Master__c = event.detail.length ? event.detail[0].id : null;
        this.draftRecord.City_Master__r = {
            Name: event.detail.length ? event.detail[0].title : null
        };
        if (!this.draftRecord.City_Master__c) {
            this.draftRecord.City_Master__c = null;
        }
        if (!this.draftRecord.State_Master__c && this.draftRecord.City_Master__c) {
            const cityData = await getCityInfo({ recordId: this.draftRecord.City_Master__c });
            this.draftRecord.State_Master__c = cityData?.State__c;
            this.draftRecord.State_Master__r = {
                Name: cityData.State__r?.Name
            };
        }
    }
    async handleAreaSelect(event) {
        this.draftRecord.Area_Master__c = event.detail.length ? event.detail[0].id : null;
        this.draftRecord.Area_Master__r = {
            Name: event.detail.length ? event.detail[0].title : null
        };
        if (!this.draftRecord.Area_Master__c) {
            this.draftRecord.State_Master__c = null;
            this.draftRecord.City_Master__c = null;
            this.draftRecord.Postal_Master__c = null;
            this.postalCode = null;
            this.isPincodeDisabled = false;
        } else {
            this.isPincodeDisabled = true;
        }
        // if (!this.draftRecord.City_Master__c && this.draftRecord.Area_Master__c) {
        if (this.draftRecord.Area_Master__c) {
            const areaData = await getAreaInfo({ recordId: this.draftRecord.Area_Master__c });
            this.draftRecord.City_Master__c = areaData.City__c;
            this.draftRecord.City_Master__r = {
                Name: areaData.City__r?.Name
            };
            this.draftRecord.State_Master__c = areaData.City__r?.State__c;
            this.draftRecord.State_Master__r = {
                Name: areaData.City__r?.State__r?.Name
            };

            if (areaData.Postal_Code__c != null) {
                this.draftRecord.Postal_Master__c = areaData.Postal_Code__c;
                this.draftRecord.Postal_Master__r = {
                    Name: areaData.Postal_Code__r?.Name
                };
                this.postalCode = areaData.Postal_Code__r?.Name;
            }
        }
    }

    async fillAddressBasedOnPincodeClick(event) {
        this.hasMultiplePinCodes = false;
        var areaMasterId = event.target.dataset.id;
        var areaName = '';
        for (let i = 0; i < this.listOfAreaMaster.length; i++) {
            if (areaMasterId == this.listOfAreaMaster[i].Id) {
                this.isPincodeDisabled = true;
                this.draftRecord.City_Master__c = this.listOfAreaMaster[i].City__c;
                this.draftRecord.City_Master__r = {
                    Name: this.listOfAreaMaster[i].City__r.Name
                };
                this.draftRecord.State_Master__c = this.listOfAreaMaster[i].City__r.State__c;
                this.draftRecord.State_Master__r = {
                    Name: this.listOfAreaMaster[i].City__r.State__r.Name
                };
                this.draftRecord.Area_Master__c = areaMasterId;
                this.draftRecord.Area_Master__r = {
                    Name: this.listOfAreaMaster[i].Name
                };
                this.draftRecord.Postal_Master__c = this.listOfAreaMaster[i].Postal_Code__c;
                this.draftRecord.Postal_Master__c = {
                    Name: this.listOfAreaMaster[i].Postal_Code__r.Name
                };
                this.postalCode = this.listOfAreaMaster[i].Postal_Code__r.Name;
                break;
            }
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    handleAddressTypeChange(event) {
        this.addressTypeValue = event.detail.value;
    }
    postalCode = null;
    streetDetails = '';
    landmarkDetails = '';
    @track addressInfo = [];
    hasMultiplePinCodes = false;
    isPincodeDisabled = false;
    @track data;
    @track listOfAreaMaster = [];

    searchPinCodeHandler = async (event) => {
        this.isLoading = true;
        var inputFields = this.template.querySelectorAll("lightning-input");
        var pincodeVar = '';
        inputFields.forEach(function (element) {
            if (element.name == "searchPincode") {
                pincodeVar = element.value;
                //   console.log(pincodeVar.toString().length);
            }
        }, this);
        if (pincodeVar.toString().length == 6) {
            await returnAreaAndPincode({ areaId: null, pinCode: pincodeVar }).then(result => {
                if (result != null && result != undefined) {
                    this.isLoading = false;
                    //console.log('-->' + JSON.stringify(result));
                    if (result.length > 0) {
                        this.hasMultiplePinCodes = true;
                        this.data = result;
                        this.listOfAreaMaster = result;
                    } else {
                        this.hasMultiplePinCodes = true;
                        this.data = null;
                    }
                } else {
                    this.data = null;
                }
            }).catch(error => {
                this.error = error;
                this.isLoading = false;
            })
        } else {
            this.isLoading = false;
        }
    }
    closeMultiplePinCodeRecordModal() {
        this.hasMultiplePinCodes = false;
    }

    saveAddressOnClick() {
        var inputFields = this.template.querySelectorAll("lightning-textarea");
        inputFields.forEach(function (element) {
            if (element.name == "streetAddress") {
                this.streetDetails = element.value;
            }
            if (element.name == "inputLandmark") {
                this.landmarkDetails = element.value;
            }
        }, this);
        if (this.streetDetails == "" || this.streetDetails == undefined) {
            this.showToast('Address is incomplete', 'Enter Street Details', 'warning');
        } else if (this.streetDetails != undefined && this.streetDetails.length > 255) {
            this.showToast('Warning', 'Street cannot have more than 255 characters.', 'warning');
        } else {
            if ((this.draftRecord.State_Master__c != null && this.draftRecord.City_Master__c != undefined && this.draftRecord.Area_Master__c != null) && (this.postalCode != null && this.postalCode != undefined)) {
                if (this.objectApiName == 'Address' && (this.recId == null || this.recId == undefined)) {
                    this.getFiredFromAura(this.recordId);
                } else {
                    this.getFiredFromAura(this.recId);
                }
            } else {
                this.showToast('Address is incomplete', 'Please fill the Address fields', 'warning');
            }
        }
    }

    getFiredFromAura(recId, event) {
        this.addressInfo.push({
            streetInfo: this.streetDetails,
            areaInfo: this.draftRecord.Area_Master__c,
            cityInfo: this.draftRecord.City_Master__c,
            stateInfo: this.draftRecord.State_Master__c,
            postalCodeInfo: this.postalCode,
            countryInfo: this.defaultCountryValue,
            addressType: this.addressTypeValue,
            landMarkInfo: this.landmarkDetails
        });
        this.updateAddressOnRecordHelper(recId);
    }
    updateAddressOnRecordHelper = async (recId, event) => {
        await updatesObjectAddress({ recId: recId, completeAddressInfo: JSON.stringify(this.addressInfo) }).then(result => {
            if (result != null && result != undefined) {
                if (result == 'true') {
                    this.addressInfo = null;
                    this.addressInfo = [];
                    this.showToast('Success', 'Address has been Updated', 'success');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1800);
                } else if (result == 'AddressTypeExist') {
                    this.addressInfo = [];
                    this.showToast('Warning', 'Address Type already exist', 'warning');
                }
            }
        }).catch(error => {
            this.showToast('Error', error.body.message, 'error');
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        })
    }
}
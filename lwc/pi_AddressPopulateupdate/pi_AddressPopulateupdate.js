import { LightningElement, track, wire, api } from "lwc";
//Reason:Relationship changed
//LastModifed on: 08-Feb-2020
//LastModifed By: Vivek S


import returnAreaAndPincode from '@salesforce/apex/PI_AddressPopulateHelper.returnAreaAndPincode';
import updatesObjectAddress from '@salesforce/apex/PI_AddressPopulateHelper.updatesObjectAddress';
import getAddressDetails from '@salesforce/apex/PI_AddressPopulateHelper.getAddressDetails';
import getAddressfromAccCon from '@salesforce/apex/PI_AddressPopulateHelper.getAddressfromAccCon';
import getAddressprepopulateDetails from '@salesforce/apex/PI_AddressPopulateHelper.getAddressprepopulateDetails';
import AddAddress from '@salesforce/apex/PI_AddressPopulateHelper.AddAddress';

import getObjectType from '@salesforce/apex/PI_AddressPopulateHelper.getObjectType';
import getProductDetails from '@salesforce/apex/PI_AddressPopulateHelper.getProductDetails';

import disableChangeAddressBtn from '@salesforce/apex/PI_AddressPopulateHelper.disableChangeAddressBtn';


import { ShowToastEvent } from 'lightning/platformShowToastEvent';//Show Toast on Success

const columns = [
    { label: 'Area Name', fieldName: 'Area__r', hideDefaultActions: true },
    { label: 'Postal Code', fieldName: 'Postal_Code__c', hideDefaultActions: true },
];



export default class Pi_AddressPopulateupdate extends LightningElement {
    /*----------GET RECORD ID-------*/
    //@api objectApiName;

    //Reason:Relationship changed
    //LastModifed on: 08-Feb-2020
    //LastModifed By: Vivek S


    @api recordId;
    @api objectApiName;

    @api CardTitle;
    @api AddressDetails;

    //boolean variables
    isAddressType = true;
    isCitiesDisabled = false;
    isLoading = false;
    isStateDisabled = false;
    isPincodeDisabled = false;
    addressTypeAccount = false;
    addressTypeContact = false;
    PrivateaddressTypeAccount = false;
    //non-boolean variables
    @track mapOfJamMaster = [];
    @track listOfAreaMaster = [];

    defaultAreaValue = '';
    cityValueSelected = '';
    stateValueFromArea = '';
    cityValueFromArea = '';
    defaultCountryValue = 'India';
    addressTypeValue = '';
    areaValue = '';
    StreetAutopopulate = '';
    addressTypeAutopopulate = '';
    LandMarkAutopopulate = '';
    @api defaultValueForCity = '--Select the city--'
    @api selectValue = '-Select-';


    //08-Feb-2020
    stateOptions;

    @track columns = columns;
    connectedCallback() {
        // console.log('RecordId'+recordId);
        this.isLoading = true;
        setTimeout(() => {
            this.isLoading = false;
        }, 2000);

        getProductDetails({ recordId: this.recordId })
            .then(result => {
                if (result == true) {
                    this.showToast('Premium product', 'This is a premium product', 'success');
                }
            })
            .catch(error => { });

        // To object Type
        getObjectType({
            recordId: this.recordId,
        })
            .then(result => {
                if (result === 'PUBLICACCOUNT') {
                    this.addressTypeAccount = true;
                    this.addressTypeContact = false;
                    this.PrivateaddressTypeAccount = false;
                } else if (result === 'PRIVATEACCOUNT') {
                    this.PrivateaddressTypeAccount = true;
                    this.addressTypeAccount = false;
                    this.addressTypeContact = false;
                }
                else {
                    this.PrivateaddressTypeAccount = false;
                    this.addressTypeContact = true;
                    this.addressTypeAccount = false;

                }
            })
            .catch(error => { });

        this.isStateDisabled = true;
        this.isCitiesDisabled = true;
        this.isPincodeDisabled = true;
        this.updateAddressssOnRecordHelper(this.recordId);
        this.disableChangeAddressBtnHelper();

    }


    //added on 26-April-2021
    enableDisableAddressChangeBtn = true;
    disableChangeAddressBtnHelper = async (event) => {
        await disableChangeAddressBtn({ recordId: this.recordId }).then(result => {
            if (result != null && result != undefined) {
                this.enableDisableAddressChangeBtn = result;
            }
        }).catch(error => {
            this.error = error;
        })
    }

    //CITY PICKLIST
    handleCityPicklistChange = async (event) => {
        let selectedStateValue = event.detail.value;
        this.cityValueSelected = event.detail.value;
    }

    areaNameId = ''
    onAreaSelection = async (event) => {
        var areaName = event.detail.selectedValue;
        var areaId = event.detail.selectedRecordId;
        //console.log('Name::' + event.detail.selectedValue);
        //console.log('Id::' + event.detail.selectedRecordId);
        if (areaName != null && areaId != null) {
            await returnAreaAndPincode({ areaId: areaId, pinCode: null }).then(result => {
                if (result != null && result != undefined) {
                    if (result.length > 0) {
                        this.listOfAreaMaster = result;
                        this.hasMultiplePinCodes = false;
                        this.isStateDisabled = true;    //disable state picklist
                        this.isPincodeDisabled = true;//disable pincode
                        let res = result;
                        if (res != undefined) {
                            for (let i = 0; i < this.listOfAreaMaster.length; i++) {
                                this.stateValueFromArea = this.listOfAreaMaster[i].State__r.Name;
                                this.areaValue = this.listOfAreaMaster[i].Name;
                                this.areaNameId = this.listOfAreaMaster[i].Id;
                                if (this.listOfAreaMaster[i].City__r.Name != undefined) {
                                    this.cityValueFromArea = this.listOfAreaMaster[i].City__r.Name;
                                    this.isCitiesDisabled = true;
                                    this.defaultValueForCity = this.listOfAreaMaster[i].City__r.Name;
                                    this.postalCode = this.listOfAreaMaster[i].Postal_Code__r.Name;
                                }
                            }
                        }
                    }
                }
            }).catch(error => {
                this.error = error;
            })
        } else {
            this.isStateDisabled = false;
            this.isCitiesDisabled = false;
            this.isPincodeDisabled = false;
            this.cityValueFromArea = null;
            this.postalCode = null;
            this.defaultValueForCity = this.selectValue;
            this.stateValueFromArea = this.selectValue;
            this.areaValue = null;
            this.areaNameId = null
        }
    }
    SelectedAreaValue;
    ScheduleThisRun(event) {
        debugger;
        this.hasMultiplePinCodes = false;
        this.SelectedAreaValue = event.target.checked;
        this.SelectedAreaValue = event.target.value;

        if (this.SelectedAreaValue != null && this.SelectedAreaValue != undefined) {
            AddAddress({
                recordId: this.recordId,
                AddressId: this.SelectedAreaValue,
            })
                .then(result => {
                    if (result != null && result != undefined) {
                        debugger;
                        this.isLoading = false;
                        if (result == true) {
                            this.showToast('success', 'Address has been Updated', 'success');
                            //eval("$A.get().fire('e.force:refreshView');");
                            window.location.reload();
                        } else if (result == false) {
                            this.showToast("Error", "Opps something went wrong!!", "error");
                            //eval("$A.get().fire('e.force:refreshView');");
                        }
                    }
                }).catch(error => {
                    this.error = error;
                    this.showToast("Error", error.body.message, "error");
                })
        } else {
            this.showToast('Address is incomplete', 'Address is incomplete', 'warning');
        }
    }


    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    hasMultiplePinCodes = false;
    @track AddressData;
    SelectAddress(event) {
        getAddressfromAccCon({
            recordId: this.recordId,
        })
            .then(result => {
                if (result != null && result != undefined) {
                    debugger;
                    this.isLoading = false;
                    if (result.length > 0) {
                        this.hasMultiplePinCodes = true;
                        this.AddressData = result;
                        //this.listOfAreaMaster = result;
                    } else {
                        this.hasMultiplePinCodes = true;
                        this.AddressData = null;
                    }
                } else {
                    this.AddressData = null;
                }

            }).catch(error => {
                this.error = error;
            })
    }



    @track data;
    searchPinCodeHandler = async (event) => {
        this.isLoading = true;
        var inputFields = this.template.querySelectorAll("lightning-input");
        var pincodeVar = '';
        inputFields.forEach(function (element) {
            if (element.name == "searchPincode") {
                pincodeVar = element.value;
            }
        }, this);
        if (pincodeVar.toString().length == 6) {
            await returnAreaAndPincode({ areaId: null, pinCode: pincodeVar }).then(result => {
                if (result != null && result != undefined) {
                    this.isLoading = false;
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
            })
        } else {
            this.isLoading = false;
        }

    }
    fillAddressBasedOnPincodeClick = async (event) => {
        debugger;
        this.hasMultiplePinCodes = false;
        var areaMasterId = event.target.dataset.id;
        var areaName = '';
        //console.log('::' + this.listOfAreaMaster);
        for (let i = 0; i < this.listOfAreaMaster.length; i++) {
            if (areaMasterId == this.listOfAreaMaster[i].Id) {
                this.cityValueFromArea = this.listOfAreaMaster[i].City__r.Name;
                this.isCitiesDisabled = true;
                this.defaultValueForCity = this.listOfAreaMaster[i].City__r.Name;
                this.postalCode = this.listOfAreaMaster[i].Postal_Code__r.Name;
                this.stateValueFromArea = this.listOfAreaMaster[i].State__r.Name;
                areaName = this.listOfAreaMaster[i].Name;
            }
        }
        //note: check if this custom event is required to make a call
        const custEvent = new CustomEvent(
            'callparent', {
            detail: event.target.value
        });
        this.dispatchEvent(custEvent);
        //triggering action via this below call
        this.template.querySelector('[data-id="pi_custom_LookupLWC"]').getFiredFromAura(areaName, areaMasterId);

    }
    closeMultiplePinCodeRecordModal() {
        this.hasMultiplePinCodes = false;
    }
    handleAddressTypeChange(event) {
        debugger;
        this.addressTypeValue = event.detail.value;
        this.updateAddressssOnRecordHelperPrePop(this.recordId);
    }
    @track addressInfo = [];
    streetDetails = '';
    saveAddressOnClick() {
        debugger;
        var inputFields = this.template.querySelectorAll("lightning-textarea");
        inputFields.forEach(function (element) {
            if (element.name == "streetAddress") {
                this.streetDetails = element.value;
            }
        }, this);
        // let isAddressEnteredBoolean = false;
        if ((this.streetDetails != null && this.streetDetails != undefined && this.streetDetails != "") && (this.areaNameId != null && this.areaNameId != undefined) && (this.cityValueFromArea != null && this.cityValueFromArea != undefined) && (this.stateValueFromArea != null && this.stateValueFromArea != undefined) && (this.postalCode != null && this.postalCode != undefined) && (this.defaultCountryValue != null && this.defaultCountryValue != undefined) && (this.addressTypeValue != null && this.addressTypeValue != undefined && this.addressTypeValue != "")) {
            // isAddressEnteredBoolean = true;
            this.getFiredFromAura(this.recordId);
        } else {
            this.showToast('warning', 'Please fill the Address fields', 'warning');
        }
    }

    @api isAddrComplete = false;
    //method to validate address 
    @api addressValidate(event) {
        var inputFields = this.template.querySelectorAll("lightning-textarea");
        inputFields.forEach(function (element) {
            if (element.name == "streetAddress") {
                this.streetDetails = element.value;
            } if (element.name == "inputLandmark") {
                this.landmarkDetails = element.value;
            }
        }, this);

        let isAddressEnteredBoolean = false;
        debugger;
        if ((this.streetDetails != null && this.streetDetails != undefined) && (this.areaNameId != null && this.areaNameId != undefined) && (this.cityValueFromArea != null && this.cityValueFromArea != undefined) && (this.stateValueFromArea != null && this.stateValueFromArea != undefined) && (this.postalCode != null && this.postalCode != undefined) && (this.defaultCountryValue != null && this.defaultCountryValue != undefined) && (this.addressTypeValue != null && this.addressTypeValue != undefined)) {
            isAddressEnteredBoolean = true;
        } else {

            isAddressEnteredBoolean = false;
            this.showToast('warning', 'Please fill the Address fields', 'warning');
        }

        const validationCheckEvent = new CustomEvent("isAddressComplete", {
            detail: { isAddressEnteredBoolean }
        });
        // Fire the custom event
        this.dispatchEvent(validationCheckEvent);
        this.isAddrComplete = isAddressEnteredBoolean;
    }

    //method to updateAddress on respective record
    getFiredFromAura(recordId, event) {
        this.addressInfo.push({
            streetInfo: this.streetDetails, areaInfo: this.areaNameId, cityInfo: this.cityValueFromArea,
            stateInfo: this.stateValueFromArea, postalCodeInfo: this.postalCode,
            countryInfo: this.defaultCountryValue, addressType: this.addressTypeValue, landMarkInfo: this.landmarkDetails
        });

        this.updateAddressOnRecordHelper(recordId);
    }


    updateAddressOnRecordHelper = async (recordId, event) => {
        //console.log('address::' + this.addressInfo);
        await updatesObjectAddress({ recId: recordId, completeAddressInfo: JSON.stringify(this.addressInfo) }).then(result => {
            if (result != null && result != undefined) {
                if (result == 'true') {
                    this.addressInfo = null;
                    this.addressInfo = [];

                    this.showToast('Success', 'Address has been Updated', 'success');
                    //eval("$A.get().fire('e.force:refreshView');");
                    window.location.reload();
                }
            }
        }).catch(error => {
            this.showToast('Error', error.body.message, 'error');
        })
    }
    @api getFiredFromAuraAdddressdetailsPrepopulate(recordId, State, City, Area, AreaId, PostalCode) {
        /*        console.log('recordId' + recordId);
                console.log('State' + State);
                console.log('City' + City);
                console.log('Area' + Area);
                console.log('AreaId' + AreaId);
                console.log('PostalCode' + PostalCode);
        */
        this.postalCode = PostalCode;
        this.stateValueFromArea = State;
        //sthis.defaultCountryValue = this.AddressDetails.Country;
        //this.defaultAreaValue =  this.AddressDetails.Area;
        this.cityValueFromArea = City;
        this.defaultValueForCity = City;
        var areaName = Area;
        var areaMasterId = AreaId;
        this.template.querySelector('[data-id="pi_custom_LookupLWC"]').getFiredFromAura(areaName, areaMasterId);
        //  this.updateAddressssOnRecordHelper(recordId);
    }
    @api getFiredFromAuraAdddressdetails(recordId) {
        this.updateAddressssOnRecordHelper(recordId);
    }

    updateAddressssOnRecordHelper = async (recordId, event) => {
        await getAddressDetails({ recordId: recordId }).then(result => {
            if (result != null && result != undefined) {
                this.AddressDetails = result;
                this.postalCode = this.AddressDetails.PostalCode;
                this.stateValueFromArea = this.AddressDetails.State;
                //sthis.defaultCountryValue = this.AddressDetails.Country;
                this.defaultAreaValue = this.AddressDetails.Area;
                this.cityValueFromArea = this.AddressDetails.City;
                this.defaultValueForCity = this.AddressDetails.City;
                this.StreetAutopopulate = this.AddressDetails.Street;
                if (this.AddressDetails.AddressType != null && this.AddressDetails.AddressType != undefined) {
                    this.addressTypeAutopopulate = this.AddressDetails.AddressType;
                }
                this.LandMarkAutopopulate = this.AddressDetails.Landmark;
                var areaName = this.AddressDetails.Area;
                var areaMasterId = this.AddressDetails.AreaId;
                this.template.querySelector('[data-id="pi_custom_LookupLWC"]').getFiredFromAura(areaName, areaMasterId);
            }
        }).catch(error => {
            this.error = error;
        })
    }


    updateAddressssOnRecordHelperPrePop = async (recordId, event) => {
        await getAddressprepopulateDetails({ recordId: recordId, addType: this.addressTypeValue }).then(result => {
            if (result != null && result != undefined) {
                this.AddressDetails = result;
                this.postalCode = this.AddressDetails.PostalCode;
                this.stateValueFromArea = this.AddressDetails.State;
                //sthis.defaultCountryValue = this.AddressDetails.Country;
                //this.defaultAreaValue =  this.AddressDetails.Area;
                this.cityValueFromArea = this.AddressDetails.City;
                this.defaultValueForCity = this.AddressDetails.City;
                this.StreetAutopopulate = this.AddressDetails.Street;
                this.addressTypeAutopopulate = this.AddressDetails.AddressType;
                if (this.AddressDetails.Landmark != undefined) {
                    this.LandMarkAutopopulate = this.AddressDetails.Landmark;
                }

                var areaName = this.AddressDetails.Area;
                var areaMasterId = this.AddressDetails.AreaId;
                //console.log('areaNameareaName' + areaName);
                //console.log('areaMasterId' + areaMasterId);
                this.template.querySelector('[data-id="pi_custom_LookupLWC"]').getFiredFromAura(areaName, areaMasterId);
            }
        }).catch(error => {
            this.error = error;
        })
    }

}
import React, { useState, useEffect } from 'react'
import {
  CircleTickMinor,
  ArchiveMinor,
  LinkMinor,
  ResourcesMajor,
  CollectionsMajor,
  FlagMajor,
  MarketingMajor} from '@shopify/polaris-icons';
import { Button, LegacyCard } from '@shopify/polaris';
import TestingStore from '../testingStore';
import api from '../api';
import transform from '../transform';
import { useParams } from 'react-router-dom';
import func from "@/util/func"
import parse from 'html-react-parser';
import PageWithMultipleCards from "../../../components/layouts/PageWithMultipleCards";
import SampleDataList from '../../../components/shared/SampleDataList';
import GithubCell from '../../../components/tables/cells/GithubCell';
import SpinnerCentered from "../../../components/progress/SpinnerCentered";
import PersistStore from '../../../../main/PersistStore';
import MoreInformationComponent from '../../../components/shared/MoreInformationComponent';

const headerDetails = [
  {
    text: "",
    value: "icon",
    itemOrder:0,
  },
  {
    text: "Name",
    value: "name",
    itemOrder:1,
    dataProps: {variant:"headingLg"}
  },
  {
    text: "Severity",
    value: "severity",
    itemOrder:2,
    dataProps: {fontWeight:"regular"}
  },
  {
    text: "Detected time",
    value: "detected_time",
    itemOrder:3,
    dataProps:{fontWeight:'regular'},
    icon: CircleTickMinor,
  },
  {
    text: 'Test category',
    value: 'testCategory',
    itemOrder:3,
    dataProps:{fontWeight:'regular'},
    icon: ArchiveMinor
  },
  {
    text: 'url',
    value: 'url',
    itemOrder:3,
    dataProps:{fontWeight:'regular'},
    icon: LinkMinor
  },
]

const moreInfoSections = {
  impact:{
    icon: FlagMajor,
    title: "Impact",
    content: ""
  },
  tags:{
    icon: CollectionsMajor,
    title: "Tags",
    content: ""
  },
  urls:{
    icon: MarketingMajor,
    title: "API endpoints affected",
    content: ""
  },
  references:{
    icon: ResourcesMajor,
    title: "References",
    content: ""
  }
}


function TestRunResultPage(props) {

  let {testingRunResult, runIssues} = props;

  const selectedTestRunResult = TestingStore(state => state.selectedTestRunResult);
  const setSelectedTestRunResult = TestingStore(state => state.setSelectedTestRunResult);
  const subCategoryFromSourceConfigMap = PersistStore(state => state.subCategoryFromSourceConfigMap);
  const [issueDetails, setIssueDetails] = useState({});
  const subCategoryMap = PersistStore(state => state.subCategoryMap);
  const params = useParams()
  const hexId = params.hexId;
  const hexId2 = params.hexId2;
  const [fullDescription, setFullDescription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [infoData, setInfoData] = useState(null)
  
  function getDescriptionText(fullDescription){
    let str = parse(subCategoryMap[issueDetails.id?.testSubCategory]?.issueDetails || "No details found");
    let finalStr = ""

    if(typeof(str) !== 'string'){
      str?.forEach((element) =>{
        if(typeof(element) === 'object'){
          if(element?.props?.children !== null){
            finalStr = finalStr + element.props.children
          }
        }else{
          finalStr = finalStr + element
        }
      })
      finalStr = finalStr.replace(/"/g, '');
      let firstLine = finalStr.split('.')[0]
      return fullDescription ? finalStr : firstLine + ". "
    }
    str = str.replace(/"/g, '');
    let firstLine = str.split('.')[0]
    return fullDescription ? str : firstLine + ". "
    
  }

  async function setData(testingRunResult, runIssues) {
    if (testingRunResult) {
      let testRunResult = transform.prepareTestRunResult(hexId, testingRunResult, subCategoryMap, subCategoryFromSourceConfigMap)
      setSelectedTestRunResult(testRunResult)
    } else {
      setSelectedTestRunResult({})
    }
    if (runIssues) {
      setIssueDetails(...[runIssues]);
      setInfoData(subCategoryMap[runIssues?.id?.testSubCategory])
    } else {
      setIssueDetails(...[{}]);
    }
  }

  useEffect(() => {
    async function fetchData() {
        if (hexId2 != undefined) {
          if (testingRunResult == undefined) {
            let res = await api.fetchTestRunResultDetails(hexId2)
            testingRunResult = res.testingRunResult;
          }
          if (runIssues == undefined) {
            let res = await api.fetchIssueFromTestRunResultDetails(hexId2)
            runIssues = res.runIssues;
          }
        }
        setData(testingRunResult, runIssues);
      setLoading(false);
    }
    fetchData();
  }, [subCategoryMap, subCategoryFromSourceConfigMap, props])

  const components = [
    loading ? [<SpinnerCentered key="loading" />] :
      issueDetails.id &&
      <LegacyCard title="Description" sectioned key="description">
        {
          getDescriptionText(fullDescription) 
        }
        <Button plain onClick={() => setFullDescription(!fullDescription)}> {fullDescription ? "Less" : "More"} information</Button>
      </LegacyCard>
    ,
    selectedTestRunResult.testResults &&
    <SampleDataList
      key={"sampleData"}
      sampleData={selectedTestRunResult?.testResults.map((result) => {
        return {originalMessage: result.originalMessage, message:result.message, highlightPaths:[]}
      })}
      isNewDiff={selectedTestRunResult?.vulnerable}
      vulnerable={selectedTestRunResult?.vulnerable}
      heading={"Attempt"}
      isVulnerable={selectedTestRunResult.vulnerable}
    />,
      issueDetails.id &&
      <MoreInformationComponent
        key="info"
        data={infoData}
        moreInfoSections={moreInfoSections}
        runIssues={issueDetails}
      />
  ]

  return (
    <PageWithMultipleCards
    title = {
      <GithubCell
      key="heading"
      width="65vw"
      nameWidth="50vw"
      data={selectedTestRunResult}
      headers={headerDetails}
      getStatus={func.getTestResultStatus}
      />
    }
    divider= {true}
    backUrl = {props?.source == "editor" ? undefined : (hexId=="issues" ? "/dashboard/issues" : `/dashboard/testing/${hexId}`)}
    isFirstPage = {props?.source == "editor"}
    // primaryAction = {props.source == "editor" ? "" : <Button primary>Create issue</Button>}
    // secondaryActions = {props.source == "editor" ? "" : <Button disclosure>Dismiss alert</Button>}
    components = {components}
    />
  )
}

export default TestRunResultPage
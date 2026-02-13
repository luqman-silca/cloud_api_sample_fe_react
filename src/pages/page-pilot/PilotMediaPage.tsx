import { useState } from 'react'
import { Layout, Switch, Radio, Divider } from 'antd'
import apiPilot from '@/api/pilot-bridge'
import { EPhotoType, EDownloadOwner } from '@/types'

function PilotMediaPage() {
  const [enablePhotoUpload, setEnablePhotoUpload] = useState(apiPilot.getAutoUploadPhoto())
  const [enableVideoUpload, setEnableVideoUpload] = useState(apiPilot.getAutoUploadVideo())
  const [photoType, setPhotoType] = useState(apiPilot.getUploadPhotoType())
  const [uploadPath, setUploadPath] = useState(apiPilot.getDownloadOwner())

  const onPhotoUpload = (checked: boolean) => {
    setEnablePhotoUpload(checked)
    apiPilot.setAutoUploadPhoto(checked)
  }

  const onVideoUpload = (checked: boolean) => {
    setEnableVideoUpload(checked)
    apiPilot.setAutoUploadVideo(checked)
  }

  const onPhotoType = (e: any) => {
    setPhotoType(e.target.value)
    apiPilot.setUploadPhotoType(e.target.value)
  }

  const onUploadPath = (e: any) => {
    setUploadPath(e.target.value)
    apiPilot.setDownloadOwner(e.target.value)
  }

  return (
    <Layout>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', backgroundColor: 'white' }}>
        <p style={{ fontSize: 16, marginLeft: 10, marginTop: 15, marginBottom: 10, color: '#939393' }}>
          When enabled, photos and videos will be automatically uploaded to this server
        </p>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 20, width: '100%' }}>
          <p style={{ marginLeft: 10, marginBottom: 0, fontSize: 16, marginRight: '73vw' }}>Auto Photo Upload</p>
          <Switch checked={enablePhotoUpload} onChange={onPhotoUpload} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          {enablePhotoUpload && (
            <Radio.Group value={photoType} onChange={onPhotoType} style={{ marginTop: 10, marginLeft: 20 }}>
              <Radio value={EPhotoType.Original}>Original Photo</Radio>
              <Radio value={EPhotoType.Preview} style={{ marginLeft: 20 }}>
                Preview Photo
              </Radio>
            </Radio.Group>
          )}
        </div>
        <div style={{ marginLeft: 10, marginRight: 10, width: '96%', marginTop: -10 }}>
          <Divider />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginTop: -10 }}>
          <p style={{ marginLeft: 10, marginBottom: 0, fontSize: 16, marginRight: '73vw' }}>Auto Video Upload</p>
          <Switch checked={enableVideoUpload} onChange={onVideoUpload} />
        </div>
        <div style={{ marginLeft: 10, marginRight: 10, width: '96%', marginTop: -10 }}>
          <Divider />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, width: '100%', marginTop: -10 }}>
          <p style={{ marginLeft: 10, marginBottom: 0, fontSize: 16, fontWeight: 'bold' }}>
            Path for uploading media resources in dual-controller mode
          </p>
          <Radio.Group value={uploadPath} buttonStyle="solid" onChange={onUploadPath} style={{ marginTop: 0, marginBottom: 0 }}>
            <Radio.Button value={EDownloadOwner.Mine}>Mine</Radio.Button>
            <Radio.Button value={EDownloadOwner.Others}>Another</Radio.Button>
          </Radio.Group>
        </div>
      </div>
    </Layout>
  )
}

export default PilotMediaPage

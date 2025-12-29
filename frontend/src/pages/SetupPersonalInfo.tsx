import { useState } from 'react'
import StatusBar from '../components/StatusBar'
import Title from '../components/Title'
import LoadingBar from '../components/LoadingBar'
import ContentWithDropdown from '../components/ContentWithDropdown'
import ContentToggleButton from '../components/ContentToggleButton'
import ContentWithoutDropdown from '../components/ContentWithoutDropdown'
import ContentBlueButton from '../components/ContentBlueButton'
import './SetupPersonalInfo.css'

interface SetupPersonalInfoProps {
  onNext?: (info: { purpose: string; gender: string; birthDate: string }) => void
}

const SetupPersonalInfo = ({ onNext }: SetupPersonalInfoProps) => {
  const [purpose, setPurpose] = useState('은퇴 후 자산 관리')
  const [gender, setGender] = useState('남성')
  const [birthDate, setBirthDate] = useState('2025/10/29')

  const purposeOptions = [
    '은퇴 후 자산 관리',
    '주택 구매',
    '자녀 교육',
    '여행 및 레저',
    '기타'
  ]

  const handleNext = () => {
    console.log('다음 단계로 이동', { purpose, gender, birthDate })
    onNext?.({ purpose, gender, birthDate })
  }

  return (
    <div className="setup-personal-info">
      <div className="setup-container">
        <div className="setup-header">
          <StatusBar />
        </div>

        <div className="setup-back-button">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div className="setup-content">
          <div className="setup-top">
            <LoadingBar currentStep={1} totalSteps={4} />
            <Title />
          </div>

          <div className="setup-form">
            <ContentWithDropdown
              label="사용목적"
              value={purpose}
              options={purposeOptions}
              onChange={setPurpose}
            />

            <ContentToggleButton
              label="성별"
              options={['남성', '여성']}
              value={gender}
              onChange={setGender}
            />

            <ContentWithoutDropdown
              label="생년월일"
              value={birthDate}
              placeholder="YYYY/MM/DD"
              onChange={setBirthDate}
            />
          </div>

          <div className="setup-bottom">
            <ContentBlueButton label="다음" onClick={handleNext} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SetupPersonalInfo

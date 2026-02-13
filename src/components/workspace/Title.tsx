import { Row, Col } from 'antd'
import DividerLine from './DividerLine'

interface TitleProps {
  title: string
  extSpan?: number
  children?: React.ReactNode
}

function Title({ title, extSpan, children }: TitleProps) {
  return (
    <>
      <div style={{ height: 40, lineHeight: '50px', fontWeight: 450 }}>
        <Row>
          <Col span={1} />
          <Col span={23 - (extSpan || 0)}>{title}</Col>
          {extSpan && <Col span={extSpan}>{children}</Col>}
        </Row>
      </div>
      <DividerLine />
    </>
  )
}

export default Title

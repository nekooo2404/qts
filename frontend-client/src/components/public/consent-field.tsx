import Link from 'next/link'
import { Check } from 'lucide-react'
import type { UseFormRegisterReturn } from 'react-hook-form'

type ConsentFieldProps = {
  id: string
  errorId: string
  registration: UseFormRegisterReturn
  invalid?: boolean
}

export function ConsentField({
  id,
  errorId,
  registration,
  invalid = false,
}: ConsentFieldProps) {
  return (
    <label
      className={`checkbox-field checkbox-field--custom${invalid ? ' checkbox-field--invalid' : ''}`}
      htmlFor={id}
    >
      <input
        id={id}
        type="checkbox"
        aria-invalid={invalid}
        aria-describedby={errorId}
        {...registration}
      />
      <span className="checkbox-field__box" aria-hidden="true">
        <Check size={14} strokeWidth={3} />
      </span>
      <span className="checkbox-field__copy">
        Tôi đồng ý QTS sử dụng thông tin này để phản hồi yêu cầu theo{' '}
        <Link className="inline-link" href="/chinh-sach-bao-mat">
          chính sách dữ liệu
        </Link>
        .
      </span>
    </label>
  )
}

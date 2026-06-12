import { useState } from 'react'
import './SignupForm.css'

const validate = (values) => {
  const errors = {}

  if (!values.name.trim()) {
    errors.name = 'Name is required'
  }

  if (!values.email) {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Enter a valid email address'
  }

  if (!values.password) {
    errors.password = 'Password is required'
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match'
  }

  return errors
}

export default function SignupForm() {
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
    if (touched[name]) {
      const newErrors = validate({ ...values, [name]: value })
      setErrors((prev) => ({ ...prev, [name]: newErrors[name] || null }))
    }
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    const newErrors = validate(values)
    setErrors((prev) => ({ ...prev, [name]: newErrors[name] || null }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = validate(values)
    setErrors(newErrors)
    setTouched({ name: true, email: true, password: true, confirmPassword: true })

    if (Object.keys(newErrors).length === 0) {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="signup-form">
        <h2>Account created!</h2>
        <p>Welcome, {values.name}. You signed up with {values.email}.</p>
      </div>
    )
  }

  return (
    <form className="signup-form" onSubmit={handleSubmit} noValidate>
      <h2>Sign Up</h2>

      <div className="field">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={touched.name && !!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {touched.name && errors.name && (
          <span id="name-error" className="error">{errors.name}</span>
        )}
      </div>

      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={touched.email && !!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {touched.email && errors.email && (
          <span id="email-error" className="error">{errors.email}</span>
        )}
      </div>

      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={touched.password && !!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
        {touched.password && errors.password && (
          <span id="password-error" className="error">{errors.password}</span>
        )}
      </div>

      <div className="field">
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={values.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={touched.confirmPassword && !!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
        />
        {touched.confirmPassword && errors.confirmPassword && (
          <span id="confirmPassword-error" className="error">{errors.confirmPassword}</span>
        )}
      </div>

      <button type="submit">Create Account</button>
    </form>
  )
}

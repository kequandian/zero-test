export default {
  fields: [
    {
      field: 'name', label: '名称', type: 'input',
      rules: [
        { required: true, message: '该项是必填的' }
      ],
    },
  ],
}
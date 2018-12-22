TODO
--
1. Map run path into swagger api /{id}
2. repeat cli, Usage: repeat 3 "command line", used to add multi records
3. test cases
   - status testcase, update status via UPDATE method is not allow
   - create_time testcase, ignore in POST body
   - update_time testcase, default null in POST body, ignore int PUT body
   - end_time testcase, update end-time and check expired status
   - POST/PUT/DELETE must return {"data":1}, or more then 1 if 200 success
   - delete testcase, check the record is deleted, GET {id}
   - CRUD testcase, update the first record, get id from GET page records etc.

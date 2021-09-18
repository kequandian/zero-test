# Testcase
```
## 组合api测试
zero-test journal set testcase
zero-test journal rewrite
# set journal testcase
# journal rewrite

# 管理员登录
zero-test login sys admin 111111 report
# 获取组织列表
zero-test get /api/sys/org

# 组织A用户登录
zero-test login sys user1234 111111 report
# 获取组织列表
zero-test get /api/sys/org

# 组织A1用户登录
zero-test login sys user12341 111111 report
# 获取组织列表
zero-test get /api/sys/org

# 组织B用户登录
zero-test login sys user12345 111111 report
# 获取组织列表
zero-test get /api/sys/org

```
---
# Start
### **login--admin**
**data**
| passwordIsEmpty | roleCodes | sessionID | avatar | accessToken | type | userId | orgId | expiresIn | tenantId | name | reset | perms | tokenType | roleNames | account |
|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|:----:|
| false | [] | -9F-O5nKHn9zZHaSXgoFRHp5wB6le9D1_CoQiMwI | /attachments/avatar/1623068357957.png | eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJvcmdJZCI6IjEwMDAwMDAwMDAwMDAwMDAwMSIsInVzZXJJZCI6Ijg3NjcwODA4MjQzNzE5Nzg1MiIsInVzZXJUeXBlIjoxMDEsImJVc2VyVHlwZSI6IlNZU1RFTSIsInRlbmFudE9yZ0lkIjoxMDAwMDAwMDAwMDAwMDAwMDEsImFjY291bnQiOiJhZG1pbiIsImV4dHJhVXNlclR5cGUiOjAsImlhdCI6MTYzMTY4ODUyOCwianRpIjoiODc2NzA4MDgyNDM3MTk3ODUyIiwic3ViIjoiYWRtaW4iLCJleHAiOjE2MzE5NDc3Mjh9.YlE8VV1uVx6FAf-5dUKf6Awt8fw0SSxdEWjJYmlxyTY1NHrarJwBZXCkwkzQb2942NpVcDDfq5yeSAom-9QGzw | A1 | 876708082437197852 | 100000000000000001 | 259200000 | 100000000000000001 | 管理员 | true | [] | Bearer | [] | admin |

---



### **login--user1234**
**data**
| code | errors | message |
|:----:|:----:|:----:|
| 4043 | [] | 没有此用户 |

---



### **login--user12341**
**data**
| code | errors | message |
|:----:|:----:|:----:|
| 4043 | [] | 没有此用户 |

---



### **login--user12345**
**data**
| code | errors | message |
|:----:|:----:|:----:|
| 4043 | [] | 没有此用户 |

---



